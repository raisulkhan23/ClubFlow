import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireViewer, roleOf } from "./helpers";
import { roleValidator, ROLES } from "./schema";

const DEMO_NAMES: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Platform Admin",
  [ROLES.ORGANIZER]: "Rehan Chowdhury",
  [ROLES.VOLUNTEER]: "Nabila Sultana",
  [ROLES.PARTICIPANT]: "Arafat Rahman",
};

/**
 * One-click demo login for judges. Only anonymous (guest) sessions can claim a
 * demo role — verified email accounts are real users and keep role=participant.
 */
export const claimDemoRole = mutation({
  args: { role: roleValidator },
  handler: async (ctx, { role }) => {
    const viewer = await requireViewer(ctx);
    if (!viewer.user.isAnonymous) {
      throw new ConvexError("Demo roles are only available for demo sessions.");
    }
    const current = roleOf(viewer.user);
    if (viewer.user.role && current !== role) {
      throw new ConvexError(
        `This session already uses the ${current} demo. Sign out and try the demo again to switch roles.`,
      );
    }

    const club = await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", "drmc-tech-carnival"))
      .first();

    if (role === ROLES.ORGANIZER || role === ROLES.VOLUNTEER) {
      if (!club) throw new ConvexError("Demo club is not seeded yet.");
    }

    await ctx.db.patch(viewer.userId, {
      role,
      name: DEMO_NAMES[role] ?? "Demo User",
      ...(club ? { clubId: club._id } : {}),
    });

    // Volunteers get assigned to the club's active events so their tools work.
    if (role === ROLES.VOLUNTEER && club) {
      const existing = await ctx.db
        .query("volunteers")
        .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
        .first();
      const events = await ctx.db
        .query("events")
        .withIndex("by_club", (q) => q.eq("clubId", club._id))
        .collect();
      const activeEvents = events
        .filter((e) => ["published", "live", "registration_closed", "completed"].includes(e.status))
        .map((e) => e._id);
      if (existing) {
        await ctx.db.patch(existing._id, { status: "active", eventIds: activeEvents });
      } else {
        await ctx.db.insert("volunteers", {
          userId: viewer.userId,
          clubId: club._id,
          name: DEMO_NAMES[role],
          role: "checkin",
          eventIds: activeEvents,
          status: "active",
          addedBy: viewer.userId,
          createdAt: Date.now(),
        });
      }
    }

    if (role === ROLES.PARTICIPANT) {
      await ctx.db.insert("notifications", {
        userId: viewer.userId,
        title: "Welcome to ClubFlow 👋",
        body: "Browse events, register in seconds and get your QR ticket. Everything you sign up for lives on My Registrations.",
        type: "system",
        link: "/events",
        createdAt: Date.now(),
      });
    }

    return { role };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { name, phone }) => {
    const viewer = await requireViewer(ctx);
    const patch: { name?: string; phone?: string } = {};
    if (name !== undefined) {
      if (name.trim().length < 2) throw new ConvexError("Name is too short.");
      patch.name = name.trim();
    }
    if (phone !== undefined) patch.phone = phone.trim() || undefined;
    await ctx.db.patch(viewer.userId, patch);
    return { ok: true };
  },
});
