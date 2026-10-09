import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, requireViewer, requireEventManage } from "./helpers";
import { ROLES } from "./schema";

/**
 * Post-event feedback. Anonymity model: when `anonymous` is true, the caller's
 * userId is simply never stored — the response record contains no identifying
 * column. This is an honest data-level guarantee, not a display-level filter.
 */
export const submit = mutation({
  args: {
    eventId: v.id("events"),
    rating: v.number(),
    venueRating: v.optional(v.number()),
    orgRating: v.optional(v.number()),
    suggestion: v.optional(v.string()),
    anonymous: v.boolean(),
  },
  handler: async (ctx, { eventId, rating, venueRating, orgRating, suggestion, anonymous }) => {
    const viewer = await requireViewer(ctx);
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError("Event not found.");
    const valid = (n: number, label: string) => {
      if (!Number.isInteger(n) || n < 1 || n > 5) throw new ConvexError(`${label} must be 1–5.`);
    };
    valid(rating, "Overall rating");
    if (venueRating !== undefined) valid(venueRating, "Venue rating");
    if (orgRating !== undefined) valid(orgRating, "Organization rating");
    if (suggestion !== undefined && suggestion.trim().length > 1000)
      throw new ConvexError("Suggestion is too long (max 1000 characters).");

    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) => q.eq("eventId", eventId).eq("userId", viewer.userId))
      .first();
    if (!reg || (reg.status !== "confirmed" && reg.status !== "pending")) {
      throw new ConvexError("Only registered participants can leave feedback for this event.");
    }

    const existing = (await ctx.db
      .query("feedback")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect()
      .then((rows) =>
        rows.filter((r) => r.userId === viewer.userId),
      )) satisfies unknown as Array<{ _id: string }>;
    if (existing.length > 0) throw new ConvexError("You already submitted feedback for this event.");

    await ctx.db.insert("feedback", {
      eventId,
      clubId: event.clubId,
      // Anonymous responses deliberately store NO userId — privacy by schema.
      ...(anonymous ? {} : { userId: viewer.userId }),
      rating,
      ...(venueRating !== undefined ? { venueRating } : {}),
      ...(orgRating !== undefined ? { orgRating } : {}),
      suggestion: suggestion?.trim() || undefined,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Aggregated, organizer-only summary. Non-anonymous feedback shows who said what. */
export const summarize = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    await requireEventManage(ctx, eventId);
    const rows = await ctx.db
      .query("feedback")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const avg = (ns: number[]) => (ns.length ? Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10 : 0);
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    for (const r of rows) breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
    const detail = await Promise.all(
      rows.map(async (r) => {
        const user = r.userId ? await ctx.db.get(r.userId) : null;
        return {
          _id: r._id,
          anonymous: !r.userId,
          participantName: user?.name ?? "Anonymous response",
          rating: r.rating,
          venueRating: r.venueRating,
          orgRating: r.orgRating,
          suggestion: r.suggestion,
          createdAt: r.createdAt,
        };
      }),
    );
    return {
      count: rows.length,
      average: avg(rows.map((r) => r.rating)),
      venueAverage: avg(rows.map((r) => r.venueRating ?? 0).filter((n) => n > 0)),
      orgAverage: avg(rows.map((r) => r.orgRating ?? 0).filter((n) => n > 0)),
      breakdown,
      detail: detail.sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

/** Whether the signed-in participant can + has submitted feedback for an event. */
export const myStatus = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const viewer = await requireViewer(ctx);
    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) => q.eq("eventId", eventId).eq("userId", viewer.userId))
      .first();
    const canSubmit = !!reg && reg.status === "confirmed" && !!reg.checkedInAt;
    const existing = (await ctx.db
      .query("feedback")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect()
      .then((rows) => rows.filter((r) => r.userId === viewer.userId))).length;
    return { canSubmit, submitted: existing > 0 };
  },
});

// ── Task comments (organizer-side, club-scoped) ──────────────────────────────

export const addTaskComment = mutation({
  args: { taskId: v.id("tasks"), body: v.string() },
  handler: async (ctx, { taskId, body }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const task = await ctx.db.get(taskId);
    if (!task) throw new ConvexError("Task not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && task.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only comment on your club's tasks.");
    if (body.trim().length === 0) throw new ConvexError("Comment cannot be empty.");
    if (body.trim().length > 1000) throw new ConvexError("Comment is too long (max 1000 characters).");
    await ctx.db.insert("taskComments", {
      taskId,
      authorId: viewer.userId,
      authorName: viewer.user.name ?? "Organizer",
      body: body.trim(),
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const listTaskComments = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const task = await ctx.db.get(taskId);
    if (!task) throw new ConvexError("Task not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && task.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only view your club's tasks.");
    const rows = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    return rows.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const deleteTaskComment = mutation({
  args: { id: v.id("taskComments") },
  handler: async (ctx, { id }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const comment = await ctx.db.get(id);
    if (!comment) throw new ConvexError("Comment not found.");
    if (comment.authorId !== viewer.userId && viewer.user.role !== ROLES.SUPER_ADMIN)
      throw new ConvexError("You can only delete your own comments.");
    await ctx.db.delete(id);
    return { ok: true };
  },
});
