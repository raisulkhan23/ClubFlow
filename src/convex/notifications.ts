import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireViewer } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.slice(0, 100);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    return rows.filter((n) => !n.readAt).length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const n = await ctx.db.get(id);
    if (!n || n.userId !== viewer.userId) return { ok: false };
    await ctx.db.patch(id, { readAt: Date.now() });
    return { ok: true };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    const now = Date.now();
    for (const n of rows.filter((r) => !r.readAt)) {
      await ctx.db.patch(n._id, { readAt: now });
    }
    return { ok: true };
  },
});
