import { v } from "convex/values";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireRole, requireViewer } from "./helpers";
import { ROLES } from "./schema";

const DAY = 86_400_000;

async function clubEvents(ctx: QueryCtx, viewer: { userId: Id<"users">; user: Doc<"users"> }) {
  if (viewer.user.role === ROLES.SUPER_ADMIN) {
    return await ctx.db.query("events").take(300);
  }
  if (viewer.user.clubId) {
    return await ctx.db
      .query("events")
      .withIndex("by_club", (q) => q.eq("clubId", viewer.user.clubId!))
      .collect();
  }
  return await ctx.db
    .query("events")
    .withIndex("by_createdBy", (q) => q.eq("createdBy", viewer.userId))
    .collect();
}

export const organizerOverview = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const events = await clubEvents(ctx, viewer);
    const eventIds = new Set(events.map((e) => e._id));

    const regs = (await ctx.db.query("registrations").take(2000)).filter((r) => eventIds.has(r.eventId));
    const confirmed = regs.filter((r) => r.status === "confirmed");
    const checkedIn = confirmed.filter((r) => r.checkedInAt);

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tasks = (await ctx.db.query("tasks").take(500)).filter(
      (t) => viewer.user.role === ROLES.SUPER_ADMIN || t.clubId === viewer.user.clubId,
    );
    const openTasks = tasks.filter((t) => t.status !== "done");

    const activity = (await ctx.db.query("activity").take(400))
      .filter((a) => viewer.user.role === ROLES.SUPER_ADMIN || a.clubId === viewer.user.clubId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    // Registrations per day, last 30 days (confirmed)
    const series: Array<{ day: string; count: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime() - 29 * DAY;
    for (let d = 0; d < 30; d++) {
      const from = start + d * DAY;
      const to = from + DAY;
      series.push({
        day: new Date(from).toISOString().slice(5, 10),
        count: confirmed.filter((r) => r.createdAt >= from && r.createdAt < to).length,
      });
    }

    // Registrations by event (top 6)
    const byEvent = events
      .map((e) => ({
        title: e.title.length > 22 ? `${e.title.slice(0, 22)}…` : e.title,
        fullTitle: e.title,
        count: confirmed.filter((r) => r.eventId === e._id).length,
      }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Category distribution
    const catCounts = new Map<string, number>();
    for (const r of confirmed) {
      const e = events.find((x) => x._id === r.eventId);
      if (e) catCounts.set(e.category, (catCounts.get(e.category) ?? 0) + 1);
    }
    const byCategory = [...catCounts.entries()].map(([name, value]) => ({ name, value }));

    // Attendance by event (live/completed)
    const attendance = events
      .filter((e) => ["live", "completed"].includes(e.status))
      .map((e) => {
        const evRegs = confirmed.filter((r) => r.eventId === e._id);
        return {
          name: e.title.length > 20 ? `${e.title.slice(0, 20)}…` : e.title,
          attendance: evRegs.length ? Math.round((evRegs.filter((r) => r.checkedInAt).length / evRegs.length) * 100) : 0,
        };
      });

    const upcoming = events
      .filter((e) => ["published", "registration_closed", "live", "draft"].includes(e.status))
      .sort((a, b) => a.startAt - b.startAt)
      .slice(0, 5)
      .map((e) => ({
        _id: e._id,
        title: e.title,
        status: e.status,
        startAt: e.startAt,
        capacity: e.capacity,
        confirmedCount: confirmed.filter((r) => r.eventId === e._id).length,
      }));

    const pendingApprovals = regs.filter((r) => r.status === "pending").length;

    return {
      stats: {
        totalEvents: events.length,
        activeEvents: events.filter((e) => ["published", "live", "registration_closed"].includes(e.status)).length,
        totalRegistrations: confirmed.length,
        todayRegistrations: confirmed.filter((r) => r.createdAt >= startOfDay.getTime()).length,
        attendanceRate: confirmed.length ? Math.round((checkedIn.length / confirmed.length) * 100) : 0,
        pendingTasks: openTasks.length,
        overdueTasks: openTasks.filter((t) => t.deadline && t.deadline < now).length,
        pendingApprovals,
        certificates: (await ctx.db.query("certificates").take(1000)).filter((c) =>
          events.some((e) => e._id === c.eventId),
        ).length,
      },
      series,
      byEvent,
      byCategory,
      attendance,
      activity,
      upcoming,
      openTasksList: openTasks
        .sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity))
        .slice(0, 6)
        .map((t) => ({ _id: t._id, title: t.title, status: t.status, priority: t.priority, deadline: t.deadline })),
    };
  },
});

export const participantOverview = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    const active = regs.filter((r) => r.status === "confirmed" || r.status === "pending");
    const now = Date.now();
    const upcoming = [];
    for (const r of active) {
      const e = await ctx.db.get(r.eventId);
      if (!e || e.endAt < now) continue;
      upcoming.push({
        _id: r._id,
        registrationId: r.registrationId,
        status: r.status,
        teamName: r.teamName,
        event: { title: e.title, slug: e.slug, startAt: e.startAt, venue: e.venue, status: e.status, coverTheme: e.coverTheme, category: e.category },
      });
    }
    upcoming.sort((a, b) => a.event.startAt - b.event.startAt);

    // Announcements for events the user is registered for
    const myEventIds = new Set(active.map((r) => r.eventId));
    const announcements = (await ctx.db.query("announcements").order("desc").take(200))
      .filter((a) => a.published && myEventIds.has(a.eventId))
      .slice(0, 6);
    const annView = [];
    for (const a of announcements) {
      const e = await ctx.db.get(a.eventId);
      annView.push({ _id: a._id, title: a.title, message: a.message, priority: a.priority, publishedAt: a.publishedAt ?? a.createdAt, eventTitle: e?.title ?? "" });
    }

    const unread = (await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", viewer.userId)).collect())
      .filter((n) => !n.readAt).length;
    const certificates = (await ctx.db.query("certificates").withIndex("by_user", (q) => q.eq("userId", viewer.userId)).collect()).length;

    return { upcoming, announcements: annView, unread, certificates, totalRegistrations: active.length };
  },
});

/** Global search for the organizer command bar. */
export const globalSearch = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const term = q.trim().toLowerCase();
    if (term.length < 2) return { events: [], registrations: [], certificates: [] };

    const events = await clubEvents(ctx, viewer);
    const eventHits = events
      .filter((e) => e.title.toLowerCase().includes(term))
      .slice(0, 4)
      .map((e) => ({ _id: e._id, title: e.title, status: e.status }));

    const regHits: Array<{ _id: Id<"registrations">; registrationId: string; participantName: string; eventTitle: string }> = [];
    if (term.startsWith("clf") || term.length >= 4) {
      const regs = (await ctx.db.query("registrations").take(1500)).filter((r) => eventIds.has(r.eventId));
      for (const r of regs) {
        if (regHits.length >= 5) break;
        const matchesId = r.registrationId.toLowerCase().includes(term);
        let participantName = "";
        if (!matchesId) {
          const u = await ctx.db.get(r.userId);
          participantName = (u?.name ?? "").toLowerCase();
          if (!participantName.includes(term)) continue;
        }
        const e = events.find((x) => x._id === r.eventId);
        regHits.push({
          _id: r._id,
          registrationId: r.registrationId,
          participantName: participantName || (await ctx.db.get(r.userId))?.name || r.registrationId,
          eventTitle: e?.title ?? "",
        });
      }
    }

    const certHits = (await ctx.db.query("certificates").take(800))
      .filter((c) => events.some((e) => e._id === c.eventId))
      .filter((c) => c.certificateId.toLowerCase().includes(term) || c.participantName.toLowerCase().includes(term))
      .slice(0, 4)
      .map((c) => ({ certificateId: c.certificateId, participantName: c.participantName }));

    return { events: eventHits, registrations: regHits, certificates: certHits };
  },
});
