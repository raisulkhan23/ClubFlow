import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./helpers";
import { ROLES } from "./schema";

export const getMyClub = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN, ROLES.VOLUNTEER);
    if (!viewer.user.clubId) return null;
    const club = await ctx.db.get(viewer.user.clubId);
    return club;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db.query("clubs").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
  },
});

export const updateMyClub = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
    facebook: v.optional(v.string()),
    instagram: v.optional(v.string()),
  },
  handler: async (ctx, patch) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    if (!viewer.user.clubId) throw new ConvexError("Your account is not linked to a club.");
    if (patch.name !== undefined && patch.name.trim().length < 3) {
      throw new ConvexError("Club name is too short.");
    }
    if (patch.contactEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.contactEmail)) {
      throw new ConvexError("Contact email is not valid.");
    }
    const clean = Object.fromEntries(
      Object.entries(patch).map(([k, val]) => [k, typeof val === "string" ? val.trim() : val]),
    );
    await ctx.db.patch(viewer.user.clubId, clean);
    return { ok: true };
  },
});

// ── Super admin ──────────────────────────────────────────────────────────────

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ROLES.SUPER_ADMIN);
    const clubs = await ctx.db.query("clubs").collect();
    const events = await ctx.db.query("events").collect();
    const regs = await ctx.db.query("registrations").collect();
    const users = await ctx.db.query("users").collect();
    return {
      clubs: clubs.map((c) => ({
        ...c,
        eventCount: events.filter((e) => e.clubId === c._id).length,
        registrationCount: events.filter((e) => e.clubId === c._id).length
          ? regs.filter((r) => events.some((e) => e._id === r.eventId && e.clubId === c._id) && r.status === "confirmed").length
          : 0,
        memberCount: users.filter((u) => u.clubId === c._id).length,
      })),
      platform: {
        clubs: clubs.length,
        events: events.length,
        publishedEvents: events.filter((e) => e.status !== "draft" && e.status !== "archived").length,
        users: users.length,
        registrations: regs.filter((r) => r.status === "confirmed").length,
        checkedIn: regs.filter((r) => r.checkedInAt).length,
      },
    };
  },
});

/** Club + organizer directory used by the super-admin console. */
export const listOrganizers = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ROLES.SUPER_ADMIN);
    const allUsers = await ctx.db.query("users").collect();
    const users = allUsers.filter((u) => u.clubId !== undefined).slice(0, 500);
    const clubs = new Map<string, string>();
    return await Promise.all(
      users.map(async (u) => {
        let clubName = clubs.get(u.clubId ?? "");
        if (u.clubId && !clubName) {
          clubName = (await ctx.db.get(u.clubId))?.name ?? "";
          clubs.set(u.clubId, clubName);
        }
        return {
          _id: u._id,
          name: u.name ?? "",
          email: u.email ?? "",
          role: u.role ?? "participant",
          clubName: clubName ?? "",
        };
      }),
    );
  },
});

/** Super admin: change a user's role. Guarded against demoting the last
 * super admin and against self-demotion that would strand the platform. */
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("super_admin"),
      v.literal("organizer"),
      v.literal("volunteer"),
      v.literal("participant"),
    ),
  },
  handler: async (ctx, { userId, role }) => {
    await requireRole(ctx, ROLES.SUPER_ADMIN);
    const target = await ctx.db.get(userId);
    if (!target) throw new ConvexError("User not found.");
    if (target.role === "super_admin" && role !== "super_admin") {
      const admins = (await ctx.db.query("users").collect()).filter(
        (u) => u.role === "super_admin",
      );
      if (admins.length <= 1) {
        throw new ConvexError("Cannot demote the last super admin.");
      }
    }
    await ctx.db.patch(userId, { role });
    return { ok: true };
  },
});

/** Super admin: delete a club only when it has no events, so no
 * registrations or certificates are orphaned. */
export const deleteClub = mutation({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, { clubId }) => {
    await requireRole(ctx, ROLES.SUPER_ADMIN);
    const club = await ctx.db.get(clubId);
    if (!club) throw new ConvexError("Club not found.");
    const events = await ctx.db
      .query("events")
      .withIndex("by_club", (q) => q.eq("clubId", clubId))
      .collect();
    if (events.length > 0) {
      throw new ConvexError(
        `${club.name} still has ${events.length} event${events.length === 1 ? "" : "s"}. Archive or delete them first.`,
      );
    }
    // Detach any remaining users linked to this empty club.
    const members = (await ctx.db.query("users").collect()).filter((u) => u.clubId === clubId);
    for (const m of members) {
      await ctx.db.patch(m._id, { clubId: undefined });
    }
    await ctx.db.delete(clubId);
    return { ok: true };
  },
});
