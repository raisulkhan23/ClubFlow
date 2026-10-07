import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { canWorkEvent, logActivity, requireRole, requireViewer } from "./helpers";
import { ROLES } from "./schema";

const volunteerRole = v.union(
  v.literal("checkin"),
  v.literal("registration_desk"),
  v.literal("coordinator"),
  v.literal("tech_support"),
  v.literal("general"),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    let rows;
    if (viewer.user.role === ROLES.SUPER_ADMIN) {
      rows = await ctx.db.query("volunteers").take(200);
    } else if (viewer.user.clubId) {
      rows = await ctx.db.query("volunteers").withIndex("by_club", (q) => q.eq("clubId", viewer.user.clubId!)).collect();
    } else {
      rows = [];
    }
    const events = new Map<string, string>();
    const out = [];
    for (const v of rows) {
      const user = await ctx.db.get(v.userId);
      const eventTitles: string[] = [];
      for (const eid of v.eventIds) {
        let t = events.get(eid);
        if (!t) {
          t = (await ctx.db.get(eid))?.title ?? "";
          events.set(eid, t);
        }
        if (t) eventTitles.push(t);
      }
      out.push({
        _id: v._id,
        name: user?.name ?? v.name,
        email: user?.email ?? "",
        role: v.role,
        status: v.status,
        eventIds: v.eventIds,
        eventTitles,
        createdAt: v.createdAt,
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  },
});

/** Add an existing ClubFlow account as a volunteer. */
export const add = mutation({
  args: {
    email: v.string(),
    role: volunteerRole,
    eventIds: v.array(v.id("events")),
  },
  handler: async (ctx, { email, role, eventIds }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const clubId = viewer.user.clubId;
    if (!clubId) throw new ConvexError("Your account is not linked to a club.");
    const emailNorm = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) throw new ConvexError("Enter a valid email address.");
    const allUsers = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", emailNorm)).first();
    const user = allUsers ?? (await ctx.db.query("users").collect()).find((u) => u.email?.toLowerCase() === emailNorm);
    if (!user) {
      throw new ConvexError("No ClubFlow account uses this email yet. Ask them to sign up at /auth first.");
    }
    const existing = await ctx.db
      .query("volunteers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { role, eventIds, status: "active" });
      return { ok: true, updated: true };
    }
    await ctx.db.insert("volunteers", {
      userId: user._id,
      clubId,
      name: user.name ?? emailNorm,
      role,
      eventIds,
      status: "active",
      addedBy: viewer.userId,
      createdAt: Date.now(),
    });
    await logActivity(ctx, {
      clubId,
      type: "volunteer.added",
      message: `${user.name ?? emailNorm} added as a volunteer`,
    });
    return { ok: true, updated: false };
  },
});

export const update = mutation({
  args: {
    id: v.id("volunteers"),
    role: v.optional(volunteerRole),
    eventIds: v.optional(v.array(v.id("events"))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, { id, ...patch }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const row = await ctx.db.get(id);
    if (!row) throw new ConvexError("Volunteer not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && row.clubId !== viewer.user.clubId) {
      throw new ConvexError("You don't have permission to edit this volunteer.");
    }
    await ctx.db.patch(id, patch);
    return { ok: true };
  },
});

export const remove = mutation({
  args: { id: v.id("volunteers") },
  handler: async (ctx, { id }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const row = await ctx.db.get(id);
    if (!row) throw new ConvexError("Volunteer not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && row.clubId !== viewer.user.clubId) {
      throw new ConvexError("You don't have permission to remove this volunteer.");
    }
    await ctx.db.delete(id);
    return { ok: true };
  },
});

// ── Volunteer self-service ───────────────────────────────────────────────────

export const myAssignments = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("volunteers")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    const out = [];
    for (const v of rows.filter((r) => r.status === "active")) {
      for (const eid of v.eventIds) {
        const e = await ctx.db.get(eid);
        if (!e) continue;
        const regs = await ctx.db
          .query("registrations")
          .withIndex("by_event", (q) => q.eq("eventId", eid))
          .collect();
        const confirmed = regs.filter((r) => r.status === "confirmed");
        out.push({
          eventId: eid,
          eventTitle: e.title,
          eventStatus: e.status,
          startAt: e.startAt,
          venue: e.venue,
          coverTheme: e.coverTheme,
          category: e.category,
          volunteerRole: v.role,
          confirmedCount: confirmed.length,
          checkedInCount: confirmed.filter((r) => r.checkedInAt).length,
        });
      }
    }
    return out;
  },
});

/** Announcements for events the volunteer is assigned to. */
export const myAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const assignments = await ctx.db
      .query("volunteers")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    const eventIds = new Set(assignments.filter((a) => a.status === "active").flatMap((a) => a.eventIds));
    const all = await ctx.db.query("announcements").order("desc").take(200);
    const out = [];
    for (const a of all.filter((x) => x.published && eventIds.has(x.eventId))) {
      const e = await ctx.db.get(a.eventId);
      out.push({ ...a, eventTitle: e?.title ?? "" });
    }
    return out;
  },
});
