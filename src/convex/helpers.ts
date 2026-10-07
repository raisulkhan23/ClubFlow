import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { ROLES, type Role } from "./schema";

export type Viewer = { userId: Id<"users">; user: Doc<"users"> };

export function roleOf(user: Doc<"users"> | null): Role {
  return (user?.role as Role | undefined) ?? ROLES.PARTICIPANT;
}

/** Current signed-in user or null. */
export async function getViewer(ctx: QueryCtx | MutationCtx): Promise<Viewer | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  return user ? { userId, user } : null;
}

/** Current signed-in user or throws a user-facing error. */
export async function requireViewer(ctx: QueryCtx | MutationCtx): Promise<Viewer> {
  const viewer = await getViewer(ctx);
  if (!viewer) throw new ConvexError("Please sign in to continue.");
  return viewer;
}

/** Throws unless the caller has one of the given roles. */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  ...roles: Role[]
): Promise<Viewer> {
  const viewer = await requireViewer(ctx);
  const role = roleOf(viewer.user);
  if (!roles.includes(role)) {
    throw new ConvexError("You don't have permission to do that.");
  }
  return viewer;
}

/** Organizer/admin access to a specific event (creator or same club, or super admin). */
export async function canManageEvent(
  ctx: QueryCtx | MutationCtx,
  viewer: Viewer,
  event: Doc<"events">,
): Promise<boolean> {
  const role = roleOf(viewer.user);
  if (role === ROLES.SUPER_ADMIN) return true;
  if (role !== ROLES.ORGANIZER) return false;
  if (event.createdBy === viewer.userId) return true;
  return viewer.user.clubId !== undefined && viewer.user.clubId === event.clubId;
}

/** Requires event-management permission, returns both viewer and event. */
export async function requireEventManage(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
): Promise<{ viewer: Viewer; event: Doc<"events"> }> {
  const viewer = await requireViewer(ctx);
  const event = await ctx.db.get(eventId);
  if (!event) throw new ConvexError("Event not found.");
  if (!(await canManageEvent(ctx, viewer, event))) {
    throw new ConvexError("You don't have permission to manage this event.");
  }
  return { viewer, event };
}

/** Volunteer assigned to the event (also true for organizers/admins of it). */
export async function canWorkEvent(
  ctx: QueryCtx | MutationCtx,
  viewer: Viewer,
  eventId: Id<"events">,
): Promise<boolean> {
  const event = await ctx.db.get(eventId);
  if (!event) return false;
  if (await canManageEvent(ctx, viewer, event)) return true;
  const role = roleOf(viewer.user);
  if (role !== ROLES.VOLUNTEER) return false;
  const assignment = await ctx.db
    .query("volunteers")
    .withIndex("by_user", (q) => q.eq("userId", viewer.userId))
    .first();
  return assignment?.status === "active" && assignment.eventIds.includes(eventId);
}

export async function logActivity(
  ctx: MutationCtx,
  entry: {
    clubId: Id<"clubs">;
    eventId?: Id<"events">;
    type: string;
    message: string;
  },
) {
  await ctx.db.insert("activity", { ...entry, createdAt: Date.now() });
}

export async function notify(
  ctx: MutationCtx,
  n: {
    userId: Id<"users">;
    title: string;
    body: string;
    type: "announcement" | "registration" | "result" | "certificate" | "system";
    eventId?: Id<"events">;
    link?: string;
  },
) {
  await ctx.db.insert("notifications", { ...n, createdAt: Date.now() });
}

async function bumpCounter(ctx: MutationCtx, key: string): Promise<number> {
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (existing) {
    const value = existing.value + 1;
    await ctx.db.patch(existing._id, { value });
    return value;
  }
  return await ctx.db.insert("counters", { key, value: 1 });
}

/** Sequential registration id, e.g. CLF-2026-000421 */
export async function nextRegistrationId(ctx: MutationCtx): Promise<string> {
  const n = await bumpCounter(ctx, "registrations");
  return `CLF-2026-${String(n).padStart(6, "0")}`;
}

/** Sequential certificate id, e.g. CLF-CERT-000108 */
export async function nextCertificateId(ctx: MutationCtx): Promise<string> {
  const n = await bumpCounter(ctx, "certificates");
  return `CLF-CERT-${String(n).padStart(6, "0")}`;
}

/** URL-safe unique slug for an event title. */
export async function slugifyUnique(
  ctx: QueryCtx | MutationCtx,
  title: string,
): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "event";
  let slug = base;
  let n = 1;
  // Loop is bounded in practice; append counter until free.
  while (await ctx.db.query("events").withIndex("by_slug", (q) => q.eq("slug", slug)).first()) {
    n += 1;
    slug = `${base}-${n}`;
    if (n > 50) {
      slug = `${base}-${Math.floor(Math.random() * 100000)}`;
      break;
    }
  }
  return slug;
}
