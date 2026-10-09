import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { logActivity, requireRole, requireEventManage, getViewer } from "./helpers";
import { ROLES } from "./schema";

const festStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "fest"
  );
}

/** Events that count as publicly listable for a fest. */
const PUBLIC_EVENT_STATUSES = ["published", "registration_closed", "live", "completed"];

async function eventsOfFest(ctx: { db: import("./_generated/server").QueryCtx["db"] }, fest: Doc<"fests">) {
  const linked = await ctx.db
    .query("events")
    .withIndex("by_festId", (q) => q.eq("festId", fest._id))
    .collect();
  if (linked.length > 0) return linked;
  // Legacy fallback: events seeded before fests existed carry a festKey string.
  if (!fest.festKey) return [];
  return await ctx.db
    .query("events")
    .withIndex("by_fest", (q) => q.eq("festKey", fest.festKey!))
    .collect();
}

// ── Public (visitor) surface ─────────────────────────────────────────────────

/** Organization profile + published fest directory for the homepage/directory. */
export const directory = query({
  args: {},
  handler: async (ctx) => {
    const fests = await ctx.db.query("fests").collect();
    const published = fests
      .filter((f) => f.status === "published")
      .sort((a, b) => a.startAt - b.startAt);
    const out = [];
    for (const fest of published) {
      const events = (await eventsOfFest(ctx, fest)).filter((e) =>
        PUBLIC_EVENT_STATUSES.includes(e.status),
      );
      const club = await ctx.db.get(fest.clubId);
      out.push({
        _id: fest._id,
        name: fest.name,
        slug: fest.slug,
        description: fest.description,
        bannerTheme: fest.bannerTheme,
        venue: fest.venue,
        startAt: fest.startAt,
        endAt: fest.endAt,
        isDemo: fest.isDemo,
        organizationName: club?.name ?? "",
        organizationSlug: club?.slug ?? "",
        eventCount: events.length,
      });
    }
    const org = out.length > 0 ? { name: out[0].organizationName, slug: out[0].organizationSlug } : null;
    return { organization: org, fests: out };
  },
});

/** One fest with its events — the fest details page. */
export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const fest = await ctx.db
      .query("fests")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!fest) return null;
    if (fest.status !== "published") {
      // Draft/archived fests are only visible to organizers of that club.
      const viewer = await getViewer(ctx);
      const canSee =
        viewer &&
        (viewer.user.role === ROLES.SUPER_ADMIN ||
          (viewer.user.role === ROLES.ORGANIZER && viewer.user.clubId === fest.clubId));
      if (!canSee) return null;
    }
    const club = await ctx.db.get(fest.clubId);
    const events = (await eventsOfFest(ctx, fest)).filter((e) =>
      PUBLIC_EVENT_STATUSES.includes(e.status),
    );
    return {
      fest: {
        _id: fest._id,
        name: fest.name,
        slug: fest.slug,
        description: fest.description,
        bannerTheme: fest.bannerTheme,
        venue: fest.venue,
        startAt: fest.startAt,
        endAt: fest.endAt,
        status: fest.status,
        isDemo: fest.isDemo,
      },
      organization: { name: club?.name ?? "", slug: club?.slug ?? "" },
      events: events
        .sort((a, b) => a.startAt - b.startAt)
        .map((e) => ({
          _id: e._id,
          title: e.title,
          slug: e.slug,
          category: e.category,
          status: e.status,
          startAt: e.startAt,
          endAt: e.endAt,
          venue: e.venue,
          capacity: e.capacity,
          registrationDeadline: e.registrationDeadline,
          coverTheme: e.coverTheme,
          kind: e.kind,
        })),
    };
  },
});

/** Breadcrumb helper for an event: org → fest → event. */
export const festForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) return null;
    const club = await ctx.db.get(event.clubId);
    let fest: Doc<"fests"> | null = null;
    if (event.festId) fest = await ctx.db.get(event.festId);
    else if (event.festKey) {
      fest = await ctx.db
        .query("fests")
        .withIndex("by_club", (q) => q.eq("clubId", event.clubId))
        .collect()
        .then((rows) => rows.find((f) => f.festKey === event.festKey) ?? null);
    }
    return {
      organizationName: club?.name ?? "",
      fest: fest
        ? { _id: fest._id, name: fest.name, slug: fest.slug, status: fest.status }
        : null,
    };
  },
});

// ── Organizer surface ────────────────────────────────────────────────────────

export const listForOrganizer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const fests =
      viewer.user.role === ROLES.SUPER_ADMIN || !viewer.user.clubId
        ? await ctx.db.query("fests").collect()
        : await ctx.db
            .query("fests")
            .withIndex("by_club", (q) => q.eq("clubId", viewer.user.clubId!))
            .collect();
    const out = [];
    for (const fest of fests.sort((a, b) => a.startAt - b.startAt)) {
      const all = await eventsOfFest(ctx, fest);
      out.push({
        _id: fest._id,
        name: fest.name,
        slug: fest.slug,
        description: fest.description,
        status: fest.status,
        venue: fest.venue,
        startAt: fest.startAt,
        endAt: fest.endAt,
        isDemo: fest.isDemo,
        eventCount: all.length,
        publishedEventCount: all.filter((e) => PUBLIC_EVENT_STATUSES.includes(e.status)).length,
      });
    }
    return out;
  },
});

export const createFest = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    venue: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    bannerTheme: v.optional(v.number()),
    status: v.optional(festStatusValidator),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const clubId = viewer.user.clubId;
    if (!clubId) throw new ConvexError("Your account is not linked to an organization.");
    if (args.name.trim().length < 3) throw new ConvexError("Festival name is too short.");
    if (args.description.trim().length < 10)
      throw new ConvexError("Please add a description of at least 10 characters.");
    if (!Number.isFinite(args.startAt) || !Number.isFinite(args.endAt) || args.endAt <= args.startAt)
      throw new ConvexError("Festival end date must be after the start date.");

    const base = slugify(args.name);
    let slug = base;
    let n = 1;
    while (
      await ctx.db.query("fests").withIndex("by_slug", (q) => q.eq("slug", slug)).first()
    ) {
      n += 1;
      slug = `${base}-${n}`;
      if (n > 50) throw new ConvexError("Could not generate a unique festival URL.");
    }
    const now = Date.now();
    const id = await ctx.db.insert("fests", {
      clubId,
      name: args.name.trim(),
      slug,
      description: args.description.trim(),
      bannerTheme: args.bannerTheme ?? 0,
      venue: args.venue?.trim() || undefined,
      startAt: args.startAt,
      endAt: args.endAt,
      status: args.status ?? "draft",
      isDemo: false,
      createdBy: viewer.userId,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity(ctx, {
      clubId,
      type: "fest.created",
      message: `Festival "${args.name.trim()}" was created`,
    });
    return { id, slug };
  },
});

export const updateFest = mutation({
  args: {
    id: v.id("fests"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    venue: v.optional(v.string()),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    bannerTheme: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const fest = await ctx.db.get(id);
    if (!fest) throw new ConvexError("Festival not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && fest.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only manage your own organization's festivals.");
    const update: Partial<Doc<"fests">> = { updatedAt: Date.now() };
    if (patch.name !== undefined) {
      if (patch.name.trim().length < 3) throw new ConvexError("Festival name is too short.");
      update.name = patch.name.trim();
    }
    if (patch.description !== undefined) update.description = patch.description.trim();
    if (patch.venue !== undefined) update.venue = patch.venue.trim() || undefined;
    if (patch.bannerTheme !== undefined) update.bannerTheme = patch.bannerTheme;
    const startAt = patch.startAt ?? fest.startAt;
    const endAt = patch.endAt ?? fest.endAt;
    if (endAt <= startAt) throw new ConvexError("Festival end date must be after the start date.");
    if (patch.startAt !== undefined) update.startAt = patch.startAt;
    if (patch.endAt !== undefined) update.endAt = patch.endAt;
    await ctx.db.patch(id, update);
    return { ok: true };
  },
});

export const setFestStatus = mutation({
  args: { id: v.id("fests"), status: festStatusValidator },
  handler: async (ctx, { id, status }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const fest = await ctx.db.get(id);
    if (!fest) throw new ConvexError("Festival not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && fest.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only manage your own organization's festivals.");
    // Publishing is allowed before events exist: a festival is a first-class
    // container, and its public page shows an honest empty state until events
    // are added. No data is invented to make it look populated.
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
    await logActivity(ctx, {
      clubId: fest.clubId,
      type: `fest.${status}`,
      message: `Festival "${fest.name}" was marked ${status}`,
    });
    return { ok: true };
  },
});

/** Move an existing event under a fest (same organization only). */
export const attachEventToFest = mutation({
  args: { eventId: v.id("events"), festId: v.id("fests") },
  handler: async (ctx, { eventId, festId }) => {
    const { event } = await requireEventManage(ctx, eventId);
    const fest = await ctx.db.get(festId);
    if (!fest) throw new ConvexError("Festival not found.");
    if (fest.clubId !== event.clubId)
      throw new ConvexError("An event can only belong to a festival from the same organization.");
    await ctx.db.patch(eventId, { festId, updatedAt: Date.now() });
    return { ok: true };
  },
});

/**
 * Idempotent rulebook bootstrap body: ensures the demonstration festivals from
 * the contest rulebook exist, links the seeded Tech Carnival events to the
 * Tech Carnival 2026 fest, and never touches another organization's records.
 * Demonstration rows are flagged `isDemo` so they are clearly labelled in UI.
 * Shared by the organizer button and by demo login.
 */
export async function ensureRulebookFestsForClub(
  ctx: import("./_generated/server").MutationCtx,
  clubId: Doc<"fests">["clubId"],
  userId: Doc<"fests">["createdBy"],
): Promise<{ created: string[]; linked: number }> {
  const now = Date.now();

  const definition = [
      {
        name: "Tech Carnival 2026",
        slug: "tech-carnival-2026",
        description:
          "The 9th DRMC International Tech Carnival — a three-day technology festival with competitions, showcases and workshops across the campus.",
        startAt: Date.UTC(2026, 9, 8, 3, 0),
        endAt: Date.UTC(2026, 9, 10, 15, 0),
        venue: "DRMC Campus",
        bannerTheme: 1,
        festKey: "drmc-tech-carnival",
        isDemo: false,
      },
      {
        name: "Winter Tech Fest 2026",
        slug: "winter-tech-fest-2026",
        description:
          "Rulebook demonstration festival: a winter season hackathon, workshop track and tech quiz for DRMC students.",
        startAt: Date.UTC(2026, 11, 18, 3, 0),
        endAt: Date.UTC(2026, 11, 20, 15, 0),
        venue: "DRMC Campus",
        bannerTheme: 2,
        festKey: undefined,
        isDemo: true,
      },
      {
        name: "Freshers Tech Fest 2027",
        slug: "freshers-tech-fest-2027",
        description:
          "Rulebook demonstration festival: an orientation-season coding challenge and AI workshop series for new students.",
        startAt: Date.UTC(2027, 1, 12, 3, 0),
        endAt: Date.UTC(2027, 1, 13, 15, 0),
        venue: "DRMC Campus",
        bannerTheme: 3,
        festKey: undefined,
        isDemo: true,
      },
    ];

    const created: string[] = [];
    const festIds: Record<string, import("./_generated/dataModel").Id<"fests">> = {};
    for (const def of definition) {
      const existing = await ctx.db
        .query("fests")
        .withIndex("by_slug", (q) => q.eq("slug", def.slug))
        .first();
      if (existing) {
        festIds[def.slug] = existing._id;
        continue;
      }
      const id = await ctx.db.insert("fests", {
        clubId,
        name: def.name,
        slug: def.slug,
        description: def.description,
        bannerTheme: def.bannerTheme,
        venue: def.venue,
        startAt: def.startAt,
        endAt: def.endAt,
        // Demonstration fests publish immediately so the rulebook festival
        // directory is complete; they carry the `isDemo` badge and no fake
        // events or registrations.
        status: "published",
        festKey: def.festKey,
        isDemo: def.isDemo,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      festIds[def.slug] = id;
      created.push(def.name);
    }

    // Link the already-seeded Tech Carnival events (festKey) to the real fest.
    const techCarnival = festIds["tech-carnival-2026"];
    let linked = 0;
    if (techCarnival) {
      const clubEvents = await ctx.db
        .query("events")
        .withIndex("by_club", (q) => q.eq("clubId", clubId))
        .collect();
      for (const e of clubEvents) {
        if (e.festId) continue;
        if (e.festKey === "drmc-tech-carnival") {
          await ctx.db.patch(e._id, { festId: techCarnival, updatedAt: now });
          linked += 1;
        }
      }
      const fest = await ctx.db.get(techCarnival);
      if (fest && fest.status === "draft" && linked > 0) {
        // Tech Carnival has verified seeded events, so it is safe to publish.
        await ctx.db.patch(techCarnival, { status: "published", updatedAt: now });
      }
    }

  return { created, linked };
}

/** Organizer-triggered entry point for the bootstrap above. */
export const ensureRulebookFests = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    if (!viewer.user.clubId)
      throw new ConvexError("Your account is not linked to an organization.");
    return await ensureRulebookFestsForClub(ctx, viewer.user.clubId, viewer.userId);
  },
});
