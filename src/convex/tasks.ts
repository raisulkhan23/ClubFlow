import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, requireRole } from "./helpers";
import { ROLES } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    let rows;
    if (viewer.user.clubId) {
      rows = await ctx.db.query("tasks").withIndex("by_club", (q) => q.eq("clubId", viewer.user.clubId!)).collect();
    } else {
      rows = await ctx.db.query("tasks").collect();
    }
    rows.sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity));
    const users = new Map<string, string>();
    return await Promise.all(
      rows.map(async (t) => {
        let assigneeName = users.get(t.assigneeId ?? "");
        if (t.assigneeId && !assigneeName) {
          assigneeName = (await ctx.db.get(t.assigneeId))?.name ?? "";
          users.set(t.assigneeId, assigneeName);
        }
        let eventTitle: string | undefined;
        if (t.eventId) eventTitle = (await ctx.db.get(t.eventId))?.title;
        return { ...t, assigneeName, eventTitle };
      }),
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    eventId: v.optional(v.id("events")),
    assigneeId: v.optional(v.id("users")),
    deadline: v.optional(v.number()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, { title, description, eventId, assigneeId, deadline, priority }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const clubId = viewer.user.clubId;
    if (!clubId) throw new ConvexError("Your account is not linked to a club.");
    if (title.trim().length < 3) throw new ConvexError("Task title is too short.");
    const now = Date.now();
    await ctx.db.insert("tasks", {
      clubId,
      eventId,
      title: title.trim(),
      description: description?.trim() || undefined,
      assigneeId,
      deadline,
      priority,
      status: "todo",
      createdBy: viewer.userId,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true };
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    eventId: v.optional(v.id("events")),
    assigneeId: v.optional(v.id("users")),
    deadline: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))),
  },
  handler: async (ctx, { id, ...patch }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const task = await ctx.db.get(id);
    if (!task) throw new ConvexError("Task not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && task.clubId !== viewer.user.clubId) {
      throw new ConvexError("You don't have permission to edit this task.");
    }
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
    if (patch.status && patch.status !== task.status) {
      await logActivity(ctx, {
        clubId: task.clubId,
        eventId: task.eventId,
        type: "task.updated",
        message: `Task "${task.title}" moved to ${patch.status.replace("_", " ")}`,
      });
    }
    return { ok: true };
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const task = await ctx.db.get(id);
    if (!task) throw new ConvexError("Task not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && task.clubId !== viewer.user.clubId) {
      throw new ConvexError("You don't have permission to delete this task.");
    }
    await ctx.db.delete(id);
    return { ok: true };
  },
});
