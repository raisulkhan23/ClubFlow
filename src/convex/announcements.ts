import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { logActivity, notify, requireEventManage, requireRole } from "./helpers";
import { ROLES } from "./schema";

async function pushToAudience(
  ctx: MutationCtx,
  eventId: Id<"events">,
  audience: "all" | "checked_in" | "pending",
  title: string,
  body: string,
  link?: string,
) {
  const regs = await ctx.db
    .query("registrations")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  const targets = regs.filter((r) => {
    if (audience === "pending") return r.status === "pending";
    if (audience === "checked_in") return r.status === "confirmed" && !!r.checkedInAt;
    return r.status === "confirmed";
  });
  // Cap notifications per announcement to keep writes bounded.
  for (const r of targets.slice(0, 300)) {
    await notify(ctx, { userId: r.userId, title, body, type: "announcement", eventId, link });
  }
}

export const create = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    message: v.string(),
    priority: v.union(v.literal("normal"), v.literal("important"), v.literal("urgent")),
    audience: v.union(v.literal("all"), v.literal("checked_in"), v.literal("pending")),
    publishNow: v.boolean(),
  },
  handler: async (ctx, { eventId, title, message, priority, audience, publishNow }) => {
    const { event } = await requireEventManage(ctx, eventId);
    if (title.trim().length < 3) throw new ConvexError("Announcement title is too short.");
    if (message.trim().length < 5) throw new ConvexError("Announcement message is too short.");
    const now = Date.now();
    const id = await ctx.db.insert("announcements", {
      clubId: event.clubId,
      eventId,
      title: title.trim(),
      message: message.trim(),
      priority,
      audience,
      published: publishNow,
      publishedAt: publishNow ? now : undefined,
      createdBy: event.createdBy,
      createdAt: now,
    });
    if (publishNow) {
      await pushToAudience(ctx, eventId, audience, title.trim(), message.trim(), "/dashboard/notifications");
      await logActivity(ctx, {
        clubId: event.clubId,
        eventId,
        type: "announcement.published",
        message: `Announcement "${title.trim()}" sent to ${event.title} participants`,
      });
    }
    return { id };
  },
});

export const setPublished = mutation({
  args: { id: v.id("announcements"), published: v.boolean() },
  handler: async (ctx, { id, published }) => {
    const ann = await ctx.db.get(id);
    if (!ann) throw new ConvexError("Announcement not found.");
    const { event } = await requireEventManage(ctx, ann.eventId);
    const wasPublished = ann.published;
    await ctx.db.patch(id, {
      published,
      ...(published && !ann.publishedAt ? { publishedAt: Date.now() } : {}),
    });
    if (published && !wasPublished) {
      await pushToAudience(ctx, ann.eventId, ann.audience, ann.title, ann.message, "/dashboard/notifications");
      await logActivity(ctx, {
        clubId: ann.clubId,
        eventId: ann.eventId,
        type: "announcement.published",
        message: `Announcement "${ann.title}" sent to ${event.title} participants`,
      });
    }
    return { ok: true };
  },
});

export const remove = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, { id }) => {
    const ann = await ctx.db.get(id);
    if (!ann) throw new ConvexError("Announcement not found.");
    await requireEventManage(ctx, ann.eventId);
    await ctx.db.delete(id);
    return { ok: true };
  },
});

export const listForOrganizer = query({
  args: { eventId: v.optional(v.id("events")) },
  handler: async (ctx, { eventId }) => {
    await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    let rows;
    if (eventId) {
      rows = await ctx.db.query("announcements").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect();
    } else {
      rows = await ctx.db.query("announcements").order("desc").take(200);
    }
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const events = new Map<string, string>();
    return await Promise.all(
      rows.map(async (a) => {
        let eventTitle = events.get(a.eventId);
        if (!eventTitle) {
          const e = await ctx.db.get(a.eventId);
          eventTitle = e?.title ?? "";
          events.set(a.eventId, eventTitle);
        }
        return { ...a, eventTitle };
      }),
    );
  },
});

/** Published announcements for a public event page. */
export const listForEventPublic = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const rows = await ctx.db
      .query("announcements")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    return rows
      .filter((a) => a.published)
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
      .slice(0, 10);
  },
});
