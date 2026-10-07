import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { logActivity, nextCertificateId, requireEventManage, requireViewer } from "./helpers";
import { ROLES } from "./schema";

const ACHIEVEMENT_BY_TYPE: Record<string, (eventTitle: string) => string> = {
  participation: (t) => `Participant — ${t}`,
  winner: (t) => `Champion — ${t}`,
  runner_up: (t) => `Runner-up — ${t}`,
  second_runner_up: (t) => `2nd Runner-up — ${t}`,
  special: (t) => `Special Recognition — ${t}`,
};

/** Issue certificates for an event. Participation for eligible participants,
 *  podium types from published results. Idempotent — skips existing certs. */
export const issueForEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const { event } = await requireEventManage(ctx, eventId);
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const results = await ctx.db.query("results").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect();
    const published = results.filter((r) => r.published);

    const club = await ctx.db.get(event.clubId);
    if (!club) throw new ConvexError("Club not found.");

    const users = new Map<Id<"users">, string>();
    const nameFor = async (reg: Doc<"registrations">) => {
      if (reg.type === "team" && reg.teamName) return reg.teamName;
      let name = users.get(reg.userId);
      if (!name) {
        const u = await ctx.db.get(reg.userId);
        name = u?.name ?? "Participant";
        users.set(reg.userId, name);
      }
      return name;
    };

    let issued = 0;
    const now = Date.now();

    // 1) Podium results → winner / runner-up / special certificates
    for (const r of published) {
      const reg = r.registrationId
        ? regs.find((x) => x.registrationId === r.registrationId)
        : undefined;
      const type =
        r.position === 1 ? "winner" : r.position === 2 ? "runner_up" : r.position === 3 ? "second_runner_up" : "special";
      const existing = reg?.certificateId
        ? await ctx.db.query("certificates").withIndex("by_certificateId", (q) => q.eq("certificateId", reg.certificateId!)).first()
        : undefined;
      if (existing && existing.type !== "participation") continue;
      if (existing) await ctx.db.delete(existing._id);
      const certificateId = await nextCertificateId(ctx);
      await ctx.db.insert("certificates", {
        certificateId,
        clubId: event.clubId,
        eventId,
        registrationId: reg?.registrationId,
        userId: reg?.userId,
        participantName: r.participantName,
        type,
        achievement: ACHIEVEMENT_BY_TYPE[type](event.title),
        issuedAt: now,
        issuedBy: event.createdBy,
      });
      if (reg) await ctx.db.patch(reg._id, { certificateId });
      issued += 1;
    }

    // 2) Participation certificates for eligible registrations (default: checked in)
    for (const reg of regs) {
      if (reg.status !== "confirmed" || !reg.checkedInAt) continue;
      if (reg.certificateId) continue;
      const certificateId = await nextCertificateId(ctx);
      await ctx.db.insert("certificates", {
        certificateId,
        clubId: event.clubId,
        eventId,
        registrationId: reg.registrationId,
        userId: reg.userId,
        participantName: await nameFor(reg),
        type: "participation",
        achievement: ACHIEVEMENT_BY_TYPE.participation(event.title),
        issuedAt: now,
        issuedBy: event.createdBy,
      });
      await ctx.db.patch(reg._id, { certificateId });
      issued += 1;
    }

    if (issued > 0) {
      await logActivity(ctx, {
        clubId: event.clubId,
        eventId,
        type: "certificate.issued",
        message: `${issued} certificate${issued === 1 ? "" : "s"} issued for ${event.title}`,
      });
    }
    return { issued };
  },
});

export const listForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    await requireEventManage(ctx, eventId);
    const rows = await ctx.db.query("certificates").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect();
    rows.sort((a, b) => b.issuedAt - a.issuedAt);
    return rows;
  },
});

export const myCertificates = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    rows.sort((a, b) => b.issuedAt - a.issuedAt);
    const out = [];
    for (const c of rows) {
      const event = await ctx.db.get(c.eventId);
      out.push({ ...c, eventTitle: event?.title ?? "", eventDate: event?.startAt ?? 0 });
    }
    return out;
  },
});

/** Public verification — no auth required. */
export const verify = query({
  args: { certificateId: v.string() },
  handler: async (ctx, { certificateId }) => {
    const id = certificateId.trim().toUpperCase();
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_certificateId", (q) => q.eq("certificateId", id))
      .first();
    if (!cert) return null;
    const event = await ctx.db.get(cert.eventId);
    const club = await ctx.db.get(cert.clubId);
    return {
      certificateId: cert.certificateId,
      participantName: cert.participantName,
      type: cert.type,
      achievement: cert.achievement,
      issuedAt: cert.issuedAt,
      eventTitle: event?.title ?? "",
      eventDate: event?.startAt ?? 0,
      clubName: club?.name ?? "",
      valid: true,
    };
  },
});

/** Count of certificates issued by the caller's club (admin/organizer stats). */
export const clubCertificateCount = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    if (viewer.user.role !== ROLES.ORGANIZER && viewer.user.role !== ROLES.SUPER_ADMIN) return 0;
    const all = await ctx.db.query("certificates").collect();
    if (viewer.user.role === ROLES.SUPER_ADMIN) return all.length;
    if (!viewer.user.clubId) return 0;
    return all.filter((c) => c.clubId === viewer.user.clubId).length;
  },
});
