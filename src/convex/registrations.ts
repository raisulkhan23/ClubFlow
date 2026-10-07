import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  canManageEvent,
  canWorkEvent,
  logActivity,
  nextRegistrationId,
  notify,
  requireEventManage,
  requireViewer,
} from "./helpers";
import { ROLES, type FormField } from "./schema";
import { canRegister, registrationState } from "../lib/event-state";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Shared view builders ─────────────────────────────────────────────────────

async function userOf(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db.get(userId);
}

/** Best display name for a registration: user record, then form answer. */
function displayName(reg: Doc<"registrations">, user?: Doc<"users"> | null): string {
  if (reg.type === "team" && reg.teamName) return reg.teamName;
  if (user?.name) return user.name;
  const nameAnswer = reg.answers.find((a) => a.fieldId.endsWith("name"));
  return typeof nameAnswer?.value === "string" ? nameAnswer.value : "Participant";
}

// ── Registration (the core flow) ─────────────────────────────────────────────

function validateAnswers(fields: FormField[], answers: Array<{ fieldId: string; value: unknown }>) {
  const byId = new Map(answers.map((a) => [a.fieldId, a.value]));
  const cleaned: Array<{ fieldId: string; value: string | number | boolean | string[] }> = [];
  const fieldById = new Map(fields.map((f) => [f.id, f]));

  for (const field of fields) {
    // Conditional visibility: hidden fields are dropped, never required.
    if (field.dependsOn) {
      const parentValue = byId.get(field.dependsOn.fieldId);
      if (parentValue !== field.dependsOn.value) continue;
    }
    const raw = byId.get(field.id);
    const empty =
      raw === undefined ||
      raw === null ||
      raw === "" ||
      (Array.isArray(raw) && raw.length === 0);

    if (field.required && empty) {
      throw new ConvexError(`"${field.label}" is required.`);
    }
    if (empty) continue;

    switch (field.type) {
      case "email":
        if (typeof raw !== "string" || !EMAIL_RE.test(raw))
          throw new ConvexError(`"${field.label}" must be a valid email address.`);
        break;
      case "phone":
        if (typeof raw !== "string" || raw.replace(/\D/g, "").length < 6)
          throw new ConvexError(`"${field.label}" must be a valid phone number.`);
        break;
      case "number": {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (Number.isNaN(n)) throw new ConvexError(`"${field.label}" must be a number.`);
        break;
      }
      case "date":
        if (typeof raw !== "string" || Number.isNaN(Date.parse(raw)))
          throw new ConvexError(`"${field.label}" must be a valid date.`);
        break;
      case "select":
      case "radio":
        if (typeof raw !== "string" || !field.options?.includes(raw))
          throw new ConvexError(`Choose a valid option for "${field.label}".`);
        break;
      case "multiselect":
        if (
          !Array.isArray(raw) ||
          raw.length === 0 ||
          !raw.every((o) => typeof o === "string" && field.options?.includes(o))
        )
          throw new ConvexError(`Choose valid options for "${field.label}".`);
        break;
      case "checkbox":
        if (typeof raw !== "boolean") throw new ConvexError(`"${field.label}" must be checked or unchecked.`);
        break;
      case "file":
        if (typeof raw !== "string") throw new ConvexError(`"${field.label}" upload failed. Please try again.`);
        break;
      default:
        if (typeof raw !== "string") throw new ConvexError(`"${field.label}" must be text.`);
        if (field.type === "textarea" && raw.length > 2000)
          throw new ConvexError(`"${field.label}" is too long (max 2000 characters).`);
        if (field.type === "text" && raw.length > 200)
          throw new ConvexError(`"${field.label}" is too long (max 200 characters).`);
    }
    cleaned.push({
      fieldId: field.id,
      value: (typeof raw === "number" ? raw : raw) as string | number | boolean | string[],
    });
  }
  return cleaned;
}

export const register = mutation({
  args: {
    eventId: v.id("events"),
    teamName: v.optional(v.string()),
    teamMembers: v.optional(v.array(v.object({ name: v.string(), email: v.optional(v.string()) }))),
    answers: v.array(v.object({ fieldId: v.string(), value: v.any() })),
  },
  handler: async (ctx, { eventId, teamName, teamMembers, answers }) => {
    const viewer = await requireViewer(ctx);
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError("Event not found.");

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const confirmedCount = regs.filter((r) => r.status === "confirmed").length;

    if (!canRegister(event, confirmedCount)) {
      throw new ConvexError(
        registrationState(event, confirmedCount) === "full"
          ? "This event is full."
          : "Registration is closed for this event.",
      );
    }

    // Duplicate guard
    const existing = regs.find(
      (r) => r.userId === viewer.userId && (r.status === "confirmed" || r.status === "pending"),
    );
    if (existing) {
      throw new ConvexError(
        existing.status === "pending"
          ? `You already have a pending registration (${existing.registrationId}).`
          : `You are already registered (${existing.registrationId}).`,
      );
    }

    // Team rules
    const members = (teamMembers ?? []).filter((m) => m.name.trim().length > 0);
    if (event.teamEvent) {
      if (!teamName || teamName.trim().length < 2)
        throw new ConvexError("Please enter a team name.");
      const total = 1 + members.length;
      const min = event.minTeamSize ?? 2;
      const max = event.maxTeamSize ?? 4;
      if (total < min) throw new ConvexError(`Teams need at least ${min} members (including you).`);
      if (total > max) throw new ConvexError(`Teams can have at most ${max} members (including you).`);
      const emails = members.map((m) => (m.email ?? "").trim().toLowerCase()).filter(Boolean);
      if (emails.some((e) => !EMAIL_RE.test(e)))
        throw new ConvexError("One of the team member emails is invalid.");
      if (new Set(emails).size !== emails.length)
        throw new ConvexError("Duplicate team member emails are not allowed.");
      if (members.some((m) => m.name.trim().length > 80))
        throw new ConvexError("Team member names are too long.");
    }

    const cleanedAnswers = validateAnswers(event.formFields, answers);
    const now = Date.now();
    const status = event.requiresApproval ? "pending" : "confirmed";
    const registrationId = await nextRegistrationId(ctx);

    await ctx.db.insert("registrations", {
      eventId,
      userId: viewer.userId,
      registrationId,
      status,
      type: event.teamEvent ? "team" : "individual",
      teamName: event.teamEvent ? teamName!.trim() : undefined,
      teamMembers: event.teamEvent ? members : [],
      answers: cleanedAnswers,
      createdAt: now,
      updatedAt: now,
    });

    await notify(ctx, {
      userId: viewer.userId,
      title: status === "pending" ? "Registration submitted" : "Registration confirmed 🎉",
      body:
        status === "pending"
          ? `Your registration ${registrationId} for ${event.title} is under review.`
          : `You're in for ${event.title}. Registration ID: ${registrationId}.`,
      type: "registration",
      eventId,
      link: "/dashboard/registrations",
    });
    await logActivity(ctx, {
      clubId: event.clubId,
      eventId,
      type: "registration.created",
      message:
        event.teamEvent && teamName
          ? `Team "${teamName.trim()}" registered for ${event.title}`
          : `${viewer.user.name ?? "A participant"} registered for ${event.title}`,
    });

    return { registrationId, status };
  },
});

// ── Check-in ─────────────────────────────────────────────────────────────────

export type CheckInOutcome =
  | { outcome: "checked_in"; participantName: string; registrationId: string; eventTitle: string; teamName?: string; checkedInAt: number }
  | { outcome: "already_checked_in"; participantName: string; registrationId: string; eventTitle: string; teamName?: string; checkedInAt: number }
  | { outcome: "invalid"; reason: string }
  | { outcome: "pending"; participantName: string; registrationId: string; eventTitle: string };

export const checkIn = mutation({
  args: {
    code: v.string(),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, { code, eventId }) => {
    const viewer = await requireViewer(ctx);
    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_registrationId", (q) => q.eq("registrationId", code.trim().toUpperCase()))
      .first();
    if (!reg || (eventId && reg.eventId !== eventId)) {
      return { outcome: "invalid", reason: `No registration found for "${code.trim()}".` } as CheckInOutcome;
    }
    const allowed = await canWorkEvent(ctx, viewer, reg.eventId);
    if (!allowed) {
      return { outcome: "invalid", reason: "You're not staff for this event." } as CheckInOutcome;
    }
    const event = await ctx.db.get(reg.eventId);
    const user = await userOf(ctx, reg.userId);
    const name = displayName(reg, user);
    const base = {
      participantName: name,
      registrationId: reg.registrationId,
      eventTitle: event?.title ?? "",
      ...(reg.teamName ? { teamName: reg.teamName } : {}),
    };

    if (reg.status === "cancelled" || reg.status === "rejected") {
      return { outcome: "invalid", reason: `Registration ${reg.registrationId} is ${reg.status}.` } as CheckInOutcome;
    }
    if (reg.status === "pending") {
      return { outcome: "pending", ...base } as CheckInOutcome;
    }
    if (reg.checkedInAt) {
      return { outcome: "already_checked_in", ...base, checkedInAt: reg.checkedInAt } as CheckInOutcome;
    }
    const now = Date.now();
    await ctx.db.patch(reg._id, { checkedInAt: now, checkedInBy: viewer.userId, updatedAt: now });
    if (event) {
      await logActivity(ctx, {
        clubId: event.clubId,
        eventId: event._id,
        type: "checkin",
        message: `${name} checked in at ${event.title}`,
      });
    }
    return { outcome: "checked_in", ...base, checkedInAt: now } as CheckInOutcome;
  },
});

/** Pre-scan lookup (manual search fallback) — verifies a code without checking in. */
export const lookupForCheckIn = query({
  args: { code: v.string(), eventId: v.optional(v.id("events")) },
  handler: async (ctx, { code, eventId }) => {
    await requireViewer(ctx);
    const reg = await ctx.db
      .query("registrations")
      .withIndex("by_registrationId", (q) => q.eq("registrationId", code.trim().toUpperCase()))
      .first();
    if (!reg || (eventId && reg.eventId !== eventId)) return null;
    const event = await ctx.db.get(reg.eventId);
    const user = await userOf(ctx, reg.userId);
    return {
      registrationId: reg.registrationId,
      status: reg.status,
      type: reg.type,
      teamName: reg.teamName,
      checkedInAt: reg.checkedInAt,
      participantName: displayName(reg, user),
      eventTitle: event?.title ?? "",
      eventId: reg.eventId,
    };
  },
});

// ── Participant queries ──────────────────────────────────────────────────────

export const myRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
      .collect();
    regs.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const reg of regs) {
      const event = await ctx.db.get(reg.eventId);
      if (!event) continue;
      out.push({
        _id: reg._id,
        registrationId: reg.registrationId,
        status: reg.status,
        type: reg.type,
        teamName: reg.teamName,
        checkedInAt: reg.checkedInAt,
        certificateId: reg.certificateId,
        createdAt: reg.createdAt,
        event: {
          title: event.title,
          slug: event.slug,
          startAt: event.startAt,
          endAt: event.endAt,
          venue: event.venue,
          status: event.status,
          category: event.category,
          coverTheme: event.coverTheme,
        },
      });
    }
    return out;
  },
});

export const getMyRegistration = query({
  args: { id: v.id("registrations") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const reg = await ctx.db.get(id);
    if (!reg) throw new ConvexError("Registration not found.");
    const event = await ctx.db.get(reg.eventId);
    if (!event) throw new ConvexError("Event not found.");
    const isOwner = reg.userId === viewer.userId;
    if (!isOwner && !(await canManageEvent(ctx, viewer, event))) {
      throw new ConvexError("You don't have access to this registration.");
    }
    const user = await userOf(ctx, reg.userId);
    const club = await ctx.db.get(event.clubId);
    const cert = reg.certificateId
      ? await ctx.db.query("certificates").withIndex("by_certificateId", (q) => q.eq("certificateId", reg.certificateId!)).first()
      : null;
    const answersView = await Promise.all(
      event.formFields.map(async (f) => {
        const a = reg.answers.find((x) => x.fieldId === f.id);
        return {
          label: f.label,
          type: f.type,
          value: a?.value ?? null,
          fileUrl: f.type === "file" && typeof a?.value === "string" ? (await ctx.storage.getUrl(a.value as Id<"_storage">)) ?? undefined : undefined,
        };
      }),
    );
    return {
      registration: {
        _id: reg._id,
        registrationId: reg.registrationId,
        status: reg.status,
        type: reg.type,
        teamName: reg.teamName,
        teamMembers: reg.teamMembers,
        checkedInAt: reg.checkedInAt,
        certificateId: reg.certificateId,
        createdAt: reg.createdAt,
        answers: answersView,
      },
      participantName: displayName(reg, user),
      participantEmail: user?.email ?? undefined,
      event: {
        title: event.title,
        slug: event.slug,
        startAt: event.startAt,
        endAt: event.endAt,
        venue: event.venue,
        status: event.status,
        coverTheme: event.coverTheme,
        contactEmail: event.contactEmail,
      },
      clubName: club?.name ?? "",
      certificate: cert
        ? { certificateId: cert.certificateId, type: cert.type, achievement: cert.achievement, issuedAt: cert.issuedAt }
        : null,
    };
  },
});

// ── Organizer / volunteer listings ───────────────────────────────────────────

export const listForEvent = query({
  args: {
    eventId: v.id("events"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, status }) => {
    const viewer = await requireViewer(ctx);
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError("Event not found.");
    if (!(await canManageEvent(ctx, viewer, event))) {
      throw new ConvexError("You don't have permission to view this event's registrations.");
    }
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    regs.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const reg of regs.slice(0, 500)) {
      if (status && status !== "all" && reg.status !== status) continue;
      const user = await userOf(ctx, reg.userId);
      out.push({
        _id: reg._id,
        registrationId: reg.registrationId,
        status: reg.status,
        type: reg.type,
        teamName: reg.teamName,
        teamMembers: reg.teamMembers,
        checkedInAt: reg.checkedInAt,
        certificateId: reg.certificateId,
        createdAt: reg.createdAt,
        participantName: displayName(reg, user),
        participantEmail: user?.email ?? "",
        answers: reg.answers,
      });
    }
    return out;
  },
});

/** Cross-event list for the organizer participants page. */
export const listAllForOrganizer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const role = viewer.user.role ?? ROLES.PARTICIPANT;
    if (role !== ROLES.ORGANIZER && role !== ROLES.SUPER_ADMIN) {
      throw new ConvexError("You don't have permission to do that.");
    }
    let events: Doc<"events">[];
    if (role === ROLES.SUPER_ADMIN) {
      events = await ctx.db.query("events").take(200);
    } else if (viewer.user.clubId) {
      events = await ctx.db
        .query("events")
        .withIndex("by_club", (q) => q.eq("clubId", viewer.user.clubId!))
        .collect();
    } else {
      events = await ctx.db
        .query("events")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", viewer.userId))
        .collect();
    }
    const eventMap = new Map(events.map((e) => [e._id, e]));
    const out = [];
    for (const [eventId, event] of eventMap) {
      const regs = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", eventId as Id<"events">))
        .collect();
      for (const reg of regs) {
        const user = await userOf(ctx, reg.userId);
        out.push({
          _id: reg._id,
          eventId: reg.eventId,
          eventTitle: event.title,
          eventStatus: event.status,
          registrationId: reg.registrationId,
          status: reg.status,
          type: reg.type,
          teamName: reg.teamName,
          checkedInAt: reg.checkedInAt,
          certificateId: reg.certificateId,
          createdAt: reg.createdAt,
          participantName: displayName(reg, user),
          participantEmail: user?.email ?? "",
        });
      }
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out.slice(0, 600);
  },
});

/** Limited view for volunteers — no emails, no answers. */
export const listForVolunteer = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const viewer = await requireViewer(ctx);
    const allowed = await canWorkEvent(ctx, viewer, eventId);
    if (!allowed) throw new ConvexError("You're not assigned to this event.");
    const event = await ctx.db.get(eventId);
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    regs.sort((a, b) => b.createdAt - a.createdAt);
    return {
      eventTitle: event?.title ?? "",
      registrations: await Promise.all(
        regs.slice(0, 500).map(async (reg) => ({
          registrationId: reg.registrationId,
          participantName: displayName(reg, await userOf(ctx, reg.userId)),
          type: reg.type,
          teamName: reg.teamName,
          status: reg.status,
          checkedInAt: reg.checkedInAt,
          createdAt: reg.createdAt,
        })),
      ),
    };
  },
});

export const getEventRegistrationStats = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const confirmed = regs.filter((r) => r.status === "confirmed");
    return {
      total: regs.length,
      confirmed: confirmed.length,
      pending: regs.filter((r) => r.status === "pending").length,
      cancelled: regs.filter((r) => r.status === "cancelled").length,
      rejected: regs.filter((r) => r.status === "rejected").length,
      checkedIn: confirmed.filter((r) => r.checkedInAt).length,
    };
  },
});

// ── Mutations: cancel / approve / reject ─────────────────────────────────────

export const cancelRegistration = mutation({
  args: { id: v.id("registrations") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const reg = await ctx.db.get(id);
    if (!reg) throw new ConvexError("Registration not found.");
    const event = await ctx.db.get(reg.eventId);
    if (!event) throw new ConvexError("Event not found.");
    const isOwner = reg.userId === viewer.userId;
    if (!isOwner && !(await canManageEvent(ctx, viewer, event))) {
      throw new ConvexError("You don't have permission to cancel this registration.");
    }
    if (reg.checkedInAt) throw new ConvexError("Checked-in registrations can't be cancelled.");
    if (reg.status !== "confirmed" && reg.status !== "pending")
      throw new ConvexError(`This registration is already ${reg.status}.`);
    await ctx.db.patch(id, { status: "cancelled", updatedAt: Date.now() });
    await logActivity(ctx, {
      clubId: event.clubId,
      eventId: event._id,
      type: "registration.cancelled",
      message: `${displayName(reg, await userOf(ctx, reg.userId))} cancelled ${reg.registrationId} for ${event.title}`,
    });
    if (!isOwner) {
      await notify(ctx, {
        userId: reg.userId,
        title: "Registration cancelled",
        body: `Your registration ${reg.registrationId} for ${event.title} was cancelled by the organizer.`,
        type: "registration",
        eventId: event._id,
        link: "/dashboard/registrations",
      });
    }
    return { ok: true };
  },
});

export const setRegistrationStatus = mutation({
  args: {
    id: v.id("registrations"),
    status: v.union(v.literal("confirmed"), v.literal("rejected"), v.literal("cancelled")),
  },
  handler: async (ctx, { id, status }) => {
    const viewer = await requireViewer(ctx);
    const reg = await ctx.db.get(id);
    if (!reg) throw new ConvexError("Registration not found.");
    const event = await ctx.db.get(reg.eventId);
    if (!event) throw new ConvexError("Event not found.");
    if (!(await canManageEvent(ctx, viewer, event))) {
      throw new ConvexError("You don't have permission to manage this registration.");
    }
    if (reg.checkedInAt) throw new ConvexError("Checked-in registrations can't be changed.");
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
    if (status === "confirmed" || status === "rejected") {
      await notify(ctx, {
        userId: reg.userId,
        title: status === "confirmed" ? "Registration approved ✅" : "Registration not accepted",
        body:
          status === "confirmed"
            ? `Your registration ${reg.registrationId} for ${event.title} has been approved.`
            : `Unfortunately your registration ${reg.registrationId} for ${event.title} was not accepted this time.`,
        type: "registration",
        eventId: event._id,
        link: "/dashboard/registrations",
      });
    }
    return { ok: true };
  },
});

/** Upload endpoint for registration file fields. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireViewer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
