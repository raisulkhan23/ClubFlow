import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { logActivity, requireRole, requireEventManage } from "./helpers";
import { ROLES } from "./schema";

const RESOURCE_CATEGORIES = ["venue", "equipment", "furniture", "tech"] as const;
const RESOURCE_CATEGORY_VALIDATOR = v.union(
  ...RESOURCE_CATEGORIES.map((c) => v.literal(c)),
);

// ── Catalog ──────────────────────────────────────────────────────────────────

export const listResources = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    if (viewer.user.role === ROLES.SUPER_ADMIN || !viewer.user.clubId) {
      // Super admin sees all; organizer without a club sees none.
      const all = await ctx.db.query("resources").collect();
      return await Promise.all(
        all
          .filter((r) => r.active)
          .map(async (r) => ({ ...r, clubName: (await ctx.db.get(r.clubId))?.name ?? "" })),
      );
    }
    const rows = await ctx.db
      .query("resources")
      .withIndex("by_club", (q) => q.eq("clubId", viewer.user.clubId!))
      .collect();
    return rows.filter((r) => r.active).map((r) => ({ ...r, clubName: "" }));
  },
});

/** Reservations visible to the organizer (their club), with resource + event titles. */
export const listReservations = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    let resources: Doc<"resources">[];
    if (viewer.user.role === ROLES.SUPER_ADMIN || !viewer.user.clubId) {
      resources = await ctx.db.query("resources").collect();
    } else {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_club", (q) => q.eq("clubId", viewer.user.clubId!))
        .collect();
    }
    const resourceIds = resources.map((r) => r._id);
    const all = await ctx.db.query("reservations").collect();
    const out = [];
    for (const res of all) {
      if (!resourceIds.includes(res.resourceId)) continue;
      const resource = resources.find((r) => r._id === res.resourceId)!;
      const event = res.eventId ? await ctx.db.get(res.eventId) : null;
      out.push({
        _id: res._id,
        resourceId: res.resourceId,
        resourceName: resource.name,
        quantity: res.quantity,
        startAt: res.startAt,
        endAt: res.endAt,
        status: res.status,
        note: res.note,
        eventId: res.eventId,
        eventTitle: event?.title ?? "",
      });
    }
    return out.sort((a, b) => b.startAt - a.startAt);
  },
});

export const addResource = mutation({
  args: {
    name: v.string(),
    category: RESOURCE_CATEGORY_VALIDATOR,
    location: v.optional(v.string()),
    quantity: v.number(),
    exclusive: v.boolean(),
    condition: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { name, category, location, quantity, exclusive, condition, notes }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    if (!viewer.user.clubId) throw new ConvexError("Your account is not linked to a club.");
    if (name.trim().length < 2) throw new ConvexError("Resource name is too short.");
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 10000)
      throw new ConvexError("Quantity must be between 1 and 10,000.");
    if (exclusive && quantity !== 1)
      throw new ConvexError("Exclusive resources must have a quantity of 1.");
    const clubId = viewer.user.clubId!;
    const id = await ctx.db.insert("resources", {
      clubId,
      name: name.trim(),
      category,
      location: location?.trim() || undefined,
      quantity,
      exclusive,
      condition: condition?.trim() || undefined,
      notes: notes?.trim() || undefined,
      active: true,
      createdBy: viewer.userId,
      createdAt: Date.now(),
    });
    await logActivity(ctx, {
      clubId,
      type: "resource.added",
      message: `${viewer.user.name ?? "Organizer"} added resource "${name.trim()}"`,
    });
    return { id };
  },
});

export const updateResource = mutation({
  args: {
    id: v.id("resources"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    quantity: v.optional(v.number()),
    condition: v.optional(v.string()),
    notes: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const resource = await ctx.db.get(id);
    if (!resource) throw new ConvexError("Resource not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && resource.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only manage your club's resources.");
    const update: Partial<Doc<"resources">> = {};
    if (patch.name !== undefined) {
      if (patch.name.trim().length < 2) throw new ConvexError("Resource name is too short.");
      update.name = patch.name.trim();
    }
    if (patch.quantity !== undefined) {
      if (!Number.isFinite(patch.quantity) || patch.quantity < 1)
        throw new ConvexError("Quantity must be at least 1.");
      update.quantity = patch.quantity;
    }
    if (patch.location !== undefined) update.location = patch.location.trim() || undefined;
    if (patch.condition !== undefined) update.condition = patch.condition.trim() || undefined;
    if (patch.notes !== undefined) update.notes = patch.notes.trim() || undefined;
    if (patch.active !== undefined) update.active = patch.active;
    await ctx.db.patch(id, update);
    return { ok: true };
  },
});

export const removeResource = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const resource = await ctx.db.get(id);
    if (!resource) throw new ConvexError("Resource not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && resource.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only manage your club's resources.");
    const active = (await ctx.db
      .query("reservations")
      .withIndex("by_resource", (q) => q.eq("resourceId", id))
      .collect())
      .filter((r) => r.status === "confirmed" || r.status === "pending");
    if (active.length > 0) {
      throw new ConvexError(
        `This resource has ${active.length} active reservation${active.length === 1 ? "" : "s"}. Cancel them first.`,
      );
    }
    await ctx.db.patch(id, { active: false });
    return { ok: true };
  },
});

// ── Reservations ─────────────────────────────────────────────────────────────

async function assertNoConflict(
  ctx: import("./_generated/server").MutationCtx,
  resource: Doc<"resources">,
  startAt: number,
  endAt: number,
  ignoreReservationId?: Id<"reservations">,
) {
  const existing = (
    await ctx.db
      .query("reservations")
      .withIndex("by_resource", (q) => q.eq("resourceId", resource._id))
      .collect()
  ).filter(
    (r) =>
      r._id !== ignoreReservationId &&
      (r.status === "confirmed" || r.status === "pending") &&
      r.startAt < endAt &&
      r.endAt > startAt, // interval overlap
  );
  if (existing.length === 0) return;
  if (resource.exclusive) {
    throw new ConvexError(
      `"${resource.name}" is already reserved ${existing.length === 1 ? "for that slot" : `for ${existing.length} overlapping slots`}. Pick a different time.`,
    );
  }
  const booked = existing.reduce((sum, r) => sum + r.quantity, 0);
  if (booked + resource.quantity - resource.quantity < 0 || booked >= resource.quantity) {
    throw new ConvexError(
      `Not enough "${resource.name}": ${booked} of ${resource.quantity} already booked for that slot.`,
    );
  }
}

export const reserve = mutation({
  args: {
    resourceId: v.id("resources"),
    eventId: v.optional(v.id("events")),
    quantity: v.number(),
    startAt: v.number(),
    endAt: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { resourceId, eventId, quantity, startAt, endAt, note }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const resource = await ctx.db.get(resourceId);
    if (!resource || !resource.active) throw new ConvexError("Resource not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && resource.clubId !== viewer.user.clubId)
      throw new ConvexError("This resource belongs to another club.");
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt)
      throw new ConvexError("Reservation end time must be after the start time.");
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > resource.quantity)
      throw new ConvexError(`Quantity must be between 1 and ${resource.quantity}.`);
    if (eventId) await requireEventManage(ctx, eventId);
    await assertNoConflict(ctx, resource, startAt, endAt);
    const id = await ctx.db.insert("reservations", {
      resourceId,
      eventId,
      clubId: resource.clubId,
      quantity,
      startAt,
      endAt,
      reservedBy: viewer.userId,
      status: "confirmed",
      note: note?.trim() || undefined,
      createdAt: Date.now(),
    });
    if (eventId) {
      const event = await ctx.db.get(eventId);
      await logActivity(ctx, {
        clubId: resource.clubId,
        eventId,
        type: "resource.reserved",
        message: `${resource.name} reserved for ${event?.title ?? "an event"}`,
      });
    }
    return { id };
  },
});

export const cancelReservation = mutation({
  args: { id: v.id("reservations") },
  handler: async (ctx, { id }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const res = await ctx.db.get(id);
    if (!res) throw new ConvexError("Reservation not found.");
    const resource = await ctx.db.get(res.resourceId);
    if (!resource) throw new ConvexError("Resource not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && resource.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only manage your club's reservations.");
    if (res.status !== "confirmed" && res.status !== "pending")
      throw new ConvexError(`Reservation is already ${res.status}.`);
    await ctx.db.patch(id, { status: "cancelled" });
    return { ok: true };
  },
});

export const markReturned = mutation({
  args: { id: v.id("reservations") },
  handler: async (ctx, { id }) => {
    const viewer = await requireRole(ctx, ROLES.ORGANIZER, ROLES.SUPER_ADMIN);
    const res = await ctx.db.get(id);
    if (!res) throw new ConvexError("Reservation not found.");
    const resource = await ctx.db.get(res.resourceId);
    if (!resource) throw new ConvexError("Resource not found.");
    if (viewer.user.role !== ROLES.SUPER_ADMIN && resource.clubId !== viewer.user.clubId)
      throw new ConvexError("You can only manage your club's reservations.");
    if (res.status !== "confirmed") throw new ConvexError("Only confirmed reservations can be returned.");
    await ctx.db.patch(id, { status: "returned" });
    return { ok: true };
  },
});
