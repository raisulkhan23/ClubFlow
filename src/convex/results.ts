import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, notify, requireEventManage } from "./helpers";

export const add = mutation({
  args: {
    eventId: v.id("events"),
    registrationId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    participantName: v.string(),
    teamName: v.optional(v.string()),
    position: v.number(),
    positionLabel: v.string(),
    score: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, input) => {
    const { event } = await requireEventManage(ctx, input.eventId);
    if (input.participantName.trim().length < 2) throw new ConvexError("Participant name is required.");
    if (input.positionLabel.trim().length < 2) throw new ConvexError("Position label is required.");
    if (input.position < 1 || input.position > 99) throw new ConvexError("Position must be between 1 and 99.");
    const id = await ctx.db.insert("results", {
      ...input,
      participantName: input.participantName.trim(),
      positionLabel: input.positionLabel.trim(),
      published: false,
      createdBy: event.createdBy,
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("results"),
    participantName: v.optional(v.string()),
    position: v.optional(v.number()),
    positionLabel: v.optional(v.string()),
    score: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new ConvexError("Result not found.");
    await requireEventManage(ctx, row.eventId);
    await ctx.db.patch(id, patch);
    return { ok: true };
  },
});

export const remove = mutation({
  args: { id: v.id("results") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new ConvexError("Result not found.");
    await requireEventManage(ctx, row.eventId);
    await ctx.db.delete(id);
    return { ok: true };
  },
});

export const setPublished = mutation({
  args: { id: v.id("results"), published: v.boolean() },
  handler: async (ctx, { id, published }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new ConvexError("Result not found.");
    const { event } = await requireEventManage(ctx, row.eventId);
    const now = Date.now();
    await ctx.db.patch(id, { published, ...(published ? { publishedAt: now } : {}) });
    if (published && !row.published) {
      // Notify all confirmed participants of the event
      const regs = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", row.eventId))
        .collect();
      for (const r of regs.filter((x) => x.status === "confirmed").slice(0, 300)) {
        await notify(ctx, {
          userId: r.userId,
          title: "Results are out 🏆",
          body: `Results for ${event.title} have been published.`,
          type: "result",
          eventId: event._id,
          link: `/events/${event.slug}`,
        });
      }
      await logActivity(ctx, {
        clubId: event.clubId,
        eventId: event._id,
        type: "result.published",
        message: `Results published for ${event.title}`,
      });
    }
    return { ok: true };
  },
});

export const listForOrganizer = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    await requireEventManage(ctx, eventId);
    const rows = await ctx.db.query("results").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect();
    rows.sort((a, b) => a.position - b.position);
    return rows;
  },
});

export const listPublished = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const rows = await ctx.db.query("results").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect();
    return rows.filter((r) => r.published).sort((a, b) => a.position - b.position);
  },
});
