import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  canManageEvent,
  logActivity,
  requireEventManage,
  requireRole,
  slugifyUnique,
} from "./helpers";
import { ROLES, categoryValidator } from "./schema";
import {
  registrationState,
  type EventRegistrationState,
} from "../lib/event-state";
import type { FormField } from "./schema";

const PUBLIC_STATUSES = ["published", "registration_closed", "live", "completed"] as const;

export type PublicEvent = Doc<"events"> & {
  clubName: string;
  confirmedCount: number;
  state: EventRegistrationState;
};

async function countConfirmed(ctx: QueryCtx, eventId: Id<"events">): Promise<number> {
  const regs = await ctx.db
    .query("registrations")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  return regs.filter((r) => r.status === "confirmed").length;
}

async function withCounts(
  ctx: QueryCtx,
  events: Doc<"events">[],
): Promise<PublicEvent[]> {
  const clubs = new Map<Id<"clubs">, string>();
  const out: PublicEvent[] = [];
  const now = Date.now();
  for (const e of events) {
    let clubName = clubs.get(e.clubId);
    if (!clubName) {
      const club = await ctx.db.get(e.clubId);
      clubName = club?.name ?? "";
      clubs.set(e.clubId, clubName);
    }
    const confirmed = await countConfirmed(ctx, e._id);
    out.push({ ...e, clubName, confirmedCount: confirmed, state: registrationState(e, confirmed, now) });
  }
  return out;
}

// ── Public queries ───────────────────────────────────────────────────────────

export const listPublic = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    sort: v.optional(v.union(v.literal("upcoming"), v.literal("newest"), v.literal("popular"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { search, category, sort = "upcoming", limit = 60 }) => {
    const all: Doc<"events">[] = [];
    for (const status of PUBLIC_STATUSES) {
      const byStatus = await ctx.db
        .query("events")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
      all.push(...byStatus);
    }
    let events = await withCounts(ctx, all.slice(0, 200));

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(s) ||
          e.shortDescription.toLowerCase().includes(s) ||
          e.category.toLowerCase().includes(s),
      );
    }
    if (category && category !== "all") {
      events = events.filter((e) => e.category === category);
    }
    if (sort === "upcoming") {
      events.sort((a, b) => a.startAt - b.startAt);
    } else if (sort === "newest") {
      events.sort((a, b) => b.publishedAt! - a.publishedAt! || b.createdAt - a.createdAt);
    } else if (sort === "popular") {
      events.sort((a, b) => b.confirmedCount - a.confirmedCount);
    }
    return events.slice(0, limit);
  },
});

export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!event || !PUBLIC_STATUSES.includes(event.status as (typeof PUBLIC_STATUSES)[number])) {
      return null;
    }
    const [withCount] = await withCounts(ctx, [event]);
    const club = await ctx.db.get(event.clubId);
    const results = (
      await ctx.db.query("results").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect()
    )
      .filter((r) => r.published)
      .sort((a, b) => a.position - b.position);
    const announcements = (
      await ctx.db.query("announcements").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect()
    )
      .filter((a) => a.published)
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
      .slice(0, 5)
      .map((a) => ({
        title: a.title,
        message: a.message,
        priority: a.priority,
        publishedAt: a.publishedAt ?? a.createdAt,
      }));
    return {
      event: withCount,
      club: club ? { name: club.name, slug: club.slug, contactEmail: club.contactEmail } : null,
      publishedResults: results.map((r) => ({
        position: r.position,
        positionLabel: r.positionLabel,
        participantName: r.participantName,
        teamName: r.teamName,
        score: r.score,
        remarks: r.remarks,
      })),
      announcements,
    };
  },
});

/** Landing-page stat strip — computed from real records. */
export const publicStats = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const publicEvents = events.filter((e) => PUBLIC_STATUSES.includes(e.status as (typeof PUBLIC_STATUSES)[number]));
    const clubs = await ctx.db.query("clubs").collect();
    const regs = await ctx.db.query("registrations").collect();
    const confirmed = regs.filter((r) => r.status === "confirmed");
    const checkedIn = confirmed.filter((r) => r.checkedInAt);
    return {
      events: publicEvents.length,
      registrations: confirmed.length,
      clubs: clubs.length,
      attendanceRate: confirmed.length ? Math.round((checkedIn.length / confirmed.length) * 100) : 0,
      upcoming: publicEvents.filter((e) => e.startAt > Date.now()).length,
    };
  },
});

// ── Organizer queries ────────────────────────────────────────────────────────

export const listForOrganizer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    let events: Doc<"events">[];
    if (roleOfIsAdmin(viewer.user.role)) {
      events = await ctx.db.query("events").order("desc").take(200);
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
    const withCount = await withCounts(ctx, events);
    withCount.sort((a, b) => b.createdAt - a.createdAt);
    return withCount;
  },
});

function roleOfIsAdmin(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export const getForOrganizer = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError("Event not found.");
    if (!(await canManageEvent(ctx, viewer, event))) {
      throw new ConvexError("You don't have permission to view this event.");
    }
    const [withCount] = await withCounts(ctx, [event]);
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const byStatus = {
      confirmed: regs.filter((r) => r.status === "confirmed").length,
      pending: regs.filter((r) => r.status === "pending").length,
      cancelled: regs.filter((r) => r.status === "cancelled").length,
      rejected: regs.filter((r) => r.status === "rejected").length,
      checkedIn: regs.filter((r) => r.checkedInAt).length,
      withCertificate: regs.filter((r) => r.certificateId).length,
    };
    const club = await ctx.db.get(event.clubId);
    return { event: withCount, counts: byStatus, clubName: club?.name ?? "" };
  },
});

/** Per-event analytics + form analytics, computed from real registration answers. */
export const getEventAnalytics = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError("Event not found.");
    if (!(await canManageEvent(ctx, viewer, event))) {
      throw new ConvexError("You don't have permission to view this event.");
    }
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    const confirmed = regs.filter((r) => r.status === "confirmed");
    const checkedIn = confirmed.filter((r) => r.checkedInAt);

    // Daily registration series, last 30 days
    const DAY = 86_400_000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime() - 29 * DAY;
    const series: Array<{ day: string; count: number }> = [];
    for (let d = 0; d < 30; d++) {
      const from = start + d * DAY;
      const to = from + DAY;
      series.push({
        day: new Date(from).toISOString().slice(5, 10),
        count: confirmed.filter((r) => r.createdAt >= from && r.createdAt < to).length,
      });
    }

    // Form analytics: distribution of answers for choice-type fields
    const distributions = event.formFields
      .filter((f) => ["select", "radio", "multiselect", "checkbox"].includes(f.type))
      .map((f) => {
        const counts = new Map<string, number>();
        for (const r of regs) {
          if (r.status === "cancelled" || r.status === "rejected") continue;
          const a = r.answers.find((x) => x.fieldId === f.id);
          if (!a) continue;
          if (Array.isArray(a.value)) {
            for (const v of a.value) counts.set(v, (counts.get(v) ?? 0) + 1);
          } else if (f.type === "checkbox") {
            counts.set(a.value === true ? "Yes" : String(a.value), (counts.get(a.value === true ? "Yes" : String(a.value)) ?? 0) + 1);
          } else if (typeof a.value === "string") {
            counts.set(a.value, (counts.get(a.value) ?? 0) + 1);
          }
        }
        const total = [...counts.values()].reduce((s, c) => s + c, 0) || 1;
        return {
          fieldId: f.id,
          label: f.label,
          type: f.type,
          total,
          items: [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) })),
        };
      });

    const responded = regs.filter((r) => r.answers.length > 0 && r.status !== "cancelled").length;

    return {
      totals: {
        registrations: regs.length,
        confirmed: confirmed.length,
        pending: regs.filter((r) => r.status === "pending").length,
        cancelled: regs.filter((r) => r.status === "cancelled").length,
        checkedIn: checkedIn.length,
        attendanceRate: confirmed.length ? Math.round((checkedIn.length / confirmed.length) * 100) : 0,
        completionRate: regs.length ? Math.round((responded / regs.length) * 100) : 0,
        conversion: confirmed.length ? Math.round((checkedIn.length / confirmed.length) * 100) : 0,
      },
      series,
      distributions,
    };
  },
});

// ── Mutations ────────────────────────────────────────────────────────────────

const scheduleItem = v.object({ id: v.string(), title: v.string(), time: v.string(), description: v.optional(v.string()) });
const faqItem = v.object({ q: v.string(), a: v.string() });

const eventInput = v.object({
  title: v.string(),
  category: categoryValidator,
  shortDescription: v.string(),
  description: v.string(),
  startAt: v.number(),
  endAt: v.number(),
  venue: v.string(),
  capacity: v.number(),
  registrationDeadline: v.number(),
  teamEvent: v.boolean(),
  minTeamSize: v.optional(v.number()),
  maxTeamSize: v.optional(v.number()),
  requiresApproval: v.boolean(),
  contactEmail: v.string(),
  contactPhone: v.optional(v.string()),
  prizes: v.optional(v.string()),
  eligibility: v.optional(v.string()),
  rules: v.optional(v.string()),
  coverTheme: v.optional(v.number()),
  faq: v.optional(v.array(faqItem)),
  schedule: v.optional(v.array(scheduleItem)),
});
export type EventInput = {
  title: string;
  category: "Technology" | "Robotics" | "Design" | "Gaming" | "Business" | "Cultural";
  shortDescription: string;
  description: string;
  startAt: number;
  endAt: number;
  venue: string;
  capacity: number;
  registrationDeadline: number;
  teamEvent: boolean;
  minTeamSize?: number;
  maxTeamSize?: number;
  requiresApproval: boolean;
  contactEmail: string;
  contactPhone?: string;
  prizes?: string;
  eligibility?: string;
  rules?: string;
  coverTheme?: number;
  faq?: Array<{ q: string; a: string }>;
  schedule?: Array<{ id: string; title: string; time: string; description?: string }>;
};

function validateEventInput(input: EventInput) {
  if (input.title.trim().length < 3) throw new ConvexError("Event title is too short.");
  if (!input.shortDescription.trim()) throw new ConvexError("Add a short description.");
  if (!input.description.trim()) throw new ConvexError("Add a full description.");
  if (input.capacity < 1 || input.capacity > 100000) throw new ConvexError("Capacity must be between 1 and 100,000.");
  if (input.endAt <= input.startAt) throw new ConvexError("The event must end after it starts.");
  if (input.registrationDeadline > input.startAt)
    throw new ConvexError("Registration deadline should be before the event starts.");
  if (input.teamEvent) {
    const min = input.minTeamSize ?? 2;
    const max = input.maxTeamSize ?? min;
    if (min < 2) throw new ConvexError("Minimum team size must be at least 2.");
    if (max < min) throw new ConvexError("Maximum team size can't be smaller than the minimum.");
    if (max > 50) throw new ConvexError("Maximum team size is 50.");
  }
}

const DEFAULT_FIELDS = (teamEvent: boolean): FormField[] => [
  { id: "f_name", type: "text", label: teamEvent ? "Team leader full name" : "Full name", required: true },
  { id: "f_email", type: "email", label: "Email", required: true },
  { id: "f_phone", type: "phone", label: "Phone", required: false },
];

export const createEvent = mutation({
  args: { input: eventInput },
  handler: async (ctx, { input }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    validateEventInput(input);
    const clubId =
      viewer.user.clubId ??
      (await ctx.db.query("clubs").withIndex("by_slug", (q) => q.eq("slug", "drmc-tech-carnival")).first())?._id;
    if (!clubId) throw new ConvexError("No club is linked to your account. Ask a super admin to add you to a club.");
    const now = Date.now();
    const slug = await slugifyUnique(ctx, input.title);
    const eventId = await ctx.db.insert("events", {
      ...input,
      minTeamSize: input.teamEvent ? (input.minTeamSize ?? 2) : undefined,
      maxTeamSize: input.teamEvent ? (input.maxTeamSize ?? 4) : undefined,
      clubId,
      createdBy: viewer.userId,
      slug,
      coverTheme: input.coverTheme ?? 0,
      formFields: DEFAULT_FIELDS(input.teamEvent),
      faq: input.faq ?? [],
      schedule: input.schedule ?? [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    return { eventId, slug };
  },
});

export const updateEvent = mutation({
  args: { eventId: v.id("events"), input: eventInput },
  handler: async (ctx, { eventId, input }) => {
    const { event } = await requireEventManage(ctx, eventId);
    validateEventInput(input);
    await ctx.db.patch(eventId, {
      ...input,
      minTeamSize: input.teamEvent ? (input.minTeamSize ?? 2) : undefined,
      maxTeamSize: input.teamEvent ? (input.maxTeamSize ?? 4) : undefined,
      updatedAt: Date.now(),
    });
    void event;
    return { ok: true };
  },
});

/** Replace the event's registration form fields (form builder). */
export const updateFormFields = mutation({
  args: {
    eventId: v.id("events"),
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        label: v.string(),
        description: v.optional(v.string()),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
        dependsOn: v.optional(v.object({ fieldId: v.string(), value: v.string() })),
      }),
    ),
  },
  handler: async (ctx, { eventId, fields }) => {
    await requireEventManage(ctx, eventId);
    for (const f of fields) {
      if (f.label.trim().length === 0) throw new ConvexError("Every field needs a label.");
      if (["select", "radio", "checkbox", "multiselect"].includes(f.type)) {
        const opts = (f.options ?? []).filter((o) => o.trim().length > 0);
        if (opts.length < 1) throw new ConvexError(`"${f.label}" needs at least one option.`);
      }
    }
    await ctx.db.patch(eventId, { formFields: fields as never, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const setEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("registration_closed"),
      v.literal("live"),
      v.literal("completed"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, { eventId, status }) => {
    const { event } = await requireEventManage(ctx, eventId);
    const now = Date.now();
    await ctx.db.patch(eventId, {
      status,
      updatedAt: now,
      ...(status === "published" && !event.publishedAt ? { publishedAt: now } : {}),
    });
    if (status === "published") {
      await logActivity(ctx, { clubId: event.clubId, eventId, type: "event.published", message: `"${event.title}" was published` });
    }
    return { ok: true };
  },
});

export const duplicateEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const { event } = await requireEventManage(ctx, eventId);
    const now = Date.now();
    const slug = await slugifyUnique(ctx, `${event.title} copy`);
    const { _id, _creationTime, ...rest } = event;
    void _id;
    void _creationTime;
    const newId = await ctx.db.insert("events", {
      ...rest,
      title: `${event.title} (Copy)`,
      slug,
      status: "draft",
      publishedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
    return { eventId: newId };
  },
});
