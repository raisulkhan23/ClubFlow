import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ORGANIZER: "organizer",
  VOLUNTEER: "volunteer",
  PARTICIPANT: "participant",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.SUPER_ADMIN),
  v.literal(ROLES.ORGANIZER),
  v.literal(ROLES.VOLUNTEER),
  v.literal(ROLES.PARTICIPANT),
);
export type Role = Infer<typeof roleValidator>;

// ── Event lifecycle ──────────────────────────────────────────────────────────
// draft → published (registration open) → registration_closed → live → completed → archived
export const eventStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("registration_closed"),
  v.literal("live"),
  v.literal("completed"),
  v.literal("archived"),
);
export type EventStatus = Infer<typeof eventStatusValidator>;

export const registrationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("rejected"),
);
export type RegistrationStatus = Infer<typeof registrationStatusValidator>;

export const CATEGORIES = [
  "Technology",
  "Robotics",
  "Design",
  "Gaming",
  "Business",
  "Cultural",
  // Added for the DRMC Tech Carnival schedule: the fest runs a large quiz
  // track, plus ceremonies and non-competitive blocks such as lunch.
  "Quiz",
  "Ceremony",
  "Break",
] as const;
export const categoryValidator = v.union(...CATEGORIES.map((c) => v.literal(c)));
export type Category = Infer<typeof categoryValidator>;

// ── Dynamic registration form fields ─────────────────────────────────────────
export const formFieldTypeValidator = v.union(
  v.literal("text"),
  v.literal("textarea"),
  v.literal("email"),
  v.literal("phone"),
  v.literal("number"),
  v.literal("date"),
  v.literal("select"),
  v.literal("radio"),
  v.literal("checkbox"),
  v.literal("multiselect"),
  v.literal("file"),
);

export const formFieldValidator = v.object({
  id: v.string(),
  type: formFieldTypeValidator,
  label: v.string(),
  description: v.optional(v.string()),
  required: v.boolean(),
  options: v.optional(v.array(v.string())),
  // Simple conditional logic: only show this field when `fieldId` equals `value`
  dependsOn: v.optional(
    v.object({ fieldId: v.string(), value: v.string() }),
  ),
});
export type FormField = Infer<typeof formFieldValidator>;

export const answerValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.array(v.string()),
);

const scheduleItemValidator = v.object({
  id: v.string(),
  title: v.string(),
  time: v.string(),
  description: v.optional(v.string()),
});

/**
 * What a schedule entry fundamentally is. A fest day mixes competitive
 * activities with ceremonies and non-registrable blocks (lunch), which must not
 * become registrable events.
 */
export const eventKindValidator = v.union(
  v.literal("competition"),
  v.literal("ceremony"),
  v.literal("break"),
);
export type EventKind = Infer<typeof eventKindValidator>;

// ── Tables ───────────────────────────────────────────────────────────────────
const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      clubId: v.optional(v.id("clubs")),
      phone: v.optional(v.string()),
    })
      .index("email", ["email"]) // index for the email. do not remove or modify
      .index("by_club", ["clubId"]),

    clubs: defineTable({
      name: v.string(),
      slug: v.string(),
      description: v.string(),
      contactEmail: v.string(),
      website: v.optional(v.string()),
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_slug", ["slug"]),

    events: defineTable({
      clubId: v.id("clubs"),
      createdBy: v.id("users"),
      title: v.string(),
      slug: v.string(),
      category: categoryValidator,
      shortDescription: v.string(),
      description: v.string(),
      status: eventStatusValidator,
      startAt: v.number(),
      endAt: v.number(),
      venue: v.string(),
      capacity: v.number(),
      registrationDeadline: v.number(),
      teamEvent: v.boolean(),
      minTeamSize: v.optional(v.number()),
      maxTeamSize: v.optional(v.number()),
      requiresApproval: v.boolean(),
      formFields: v.array(formFieldValidator),
      prizes: v.optional(v.string()),
      eligibility: v.optional(v.string()),
      rules: v.optional(v.string()),
      contactEmail: v.string(),
      contactPhone: v.optional(v.string()),
      faq: v.array(v.object({ q: v.string(), a: v.string() })),
      schedule: v.array(scheduleItemValidator),
      coverTheme: v.number(), // index into the cover gradient presets
      publishedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),

      // ── Fest scheduling (optional, so ordinary events are unaffected).
      // Present on every entry generated from the official DRMC Tech
      // Carnival 2026 schedule.
      /** competition | ceremony | break (lunch). */
      kind: v.optional(eventKindValidator),
      /** Parent competition across days, e.g. "arcane-draw". One event row per
       *  daily session; seriesKey links sessions without merging them. */
      seriesKey: v.optional(v.string()),
      /** Fest this entry belongs to, e.g. "drmc-tc-2026". */
      festKey: v.optional(v.string()),
    })
      .index("by_club", ["clubId"])
      .index("by_status", ["status"])
      .index("by_slug", ["slug"])
      .index("by_createdBy", ["createdBy"])
      .index("by_fest", ["festKey"])
      .index("by_series", ["seriesKey"]),

    registrations: defineTable({
      eventId: v.id("events"),
      userId: v.id("users"),
      registrationId: v.string(), // CLF-2026-XXXXXX
      status: registrationStatusValidator,
      type: v.union(v.literal("individual"), v.literal("team")),
      teamName: v.optional(v.string()),
      teamMembers: v.array(v.object({ name: v.string(), email: v.optional(v.string()) })),
      answers: v.array(v.object({ fieldId: v.string(), value: answerValueValidator })),
      checkedInAt: v.optional(v.number()),
      checkedInBy: v.optional(v.id("users")),
      certificateId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_event", ["eventId"])
      .index("by_user", ["userId"])
      .index("by_registrationId", ["registrationId"])
      .index("by_event_user", ["eventId", "userId"]),

    announcements: defineTable({
      clubId: v.id("clubs"),
      eventId: v.id("events"),
      title: v.string(),
      message: v.string(),
      priority: v.union(v.literal("normal"), v.literal("important"), v.literal("urgent")),
      audience: v.union(v.literal("all"), v.literal("checked_in"), v.literal("pending")),
      published: v.boolean(),
      publishedAt: v.optional(v.number()),
      createdBy: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_event", ["eventId"])
      .index("by_club", ["clubId"]),

    notifications: defineTable({
      userId: v.id("users"),
      title: v.string(),
      body: v.string(),
      type: v.union(
        v.literal("announcement"),
        v.literal("registration"),
        v.literal("result"),
        v.literal("certificate"),
        v.literal("system"),
      ),
      eventId: v.optional(v.id("events")),
      link: v.optional(v.string()),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    tasks: defineTable({
      clubId: v.id("clubs"),
      eventId: v.optional(v.id("events")),
      title: v.string(),
      description: v.optional(v.string()),
      assigneeId: v.optional(v.id("users")),
      deadline: v.optional(v.number()),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
      status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("blocked"), v.literal("done")),
      blockedBy: v.optional(v.array(v.id("tasks"))),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_club", ["clubId"])
      .index("by_status", ["status"]),

    volunteers: defineTable({
      userId: v.id("users"),
      clubId: v.id("clubs"),
      name: v.string(),
      role: v.union(
        v.literal("checkin"),
        v.literal("registration_desk"),
        v.literal("coordinator"),
        v.literal("tech_support"),
        v.literal("general"),
      ),
      eventIds: v.array(v.id("events")),
      status: v.union(v.literal("active"), v.literal("inactive")),
      addedBy: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_club", ["clubId"]),

    results: defineTable({
      eventId: v.id("events"),
      registrationId: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      participantName: v.string(),
      teamName: v.optional(v.string()),
      position: v.number(), // 1 = winner, 2 = runner-up, 3 = 2nd runner-up, 4+ = special
      positionLabel: v.string(), // e.g. "Winner", "Runner-up", "Best Idea"
      score: v.optional(v.number()),
      remarks: v.optional(v.string()),
      published: v.boolean(),
      publishedAt: v.optional(v.number()),
      createdBy: v.id("users"),
      createdAt: v.number(),
    }).index("by_event", ["eventId"]),

    certificates: defineTable({
      certificateId: v.string(), // CLF-CERT-XXXXXX
      clubId: v.id("clubs"),
      eventId: v.id("events"),
      registrationId: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      participantName: v.string(),
      type: v.union(
        v.literal("participation"),
        v.literal("winner"),
        v.literal("runner_up"),
        v.literal("second_runner_up"),
        v.literal("special"),
      ),
      achievement: v.string(), // human-readable achievement line
      issuedAt: v.number(),
      issuedBy: v.id("users"),
    })
      .index("by_certificateId", ["certificateId"])
      .index("by_event", ["eventId"])
      .index("by_user", ["userId"]),

    activity: defineTable({
      clubId: v.id("clubs"),
      eventId: v.optional(v.id("events")),
      type: v.string(), // registration.created | registration.cancelled | event.published | checkin | result.published | announcement.published | certificate.issued | task.updated | volunteer.added
      message: v.string(),
      createdAt: v.number(),
    }).index("by_club", ["clubId"]),

    counters: defineTable({
      key: v.string(),
      value: v.number(),
    }).index("by_key", ["key"]),

    meta: defineTable({
      key: v.string(),
      value: v.optional(v.string()),
    }).index("by_key", ["key"]),

    // ── ClubFlow 3.0 ─────────────────────────────────────────────────────────
    // Catalog of usable campus facilities/equipment, owned by a club.
    resources: defineTable({
      clubId: v.id("clubs"),
      name: v.string(),
      category: v.union(
        v.literal("venue"),
        v.literal("equipment"),
        v.literal("furniture"),
        v.literal("tech"),
      ),
      location: v.optional(v.string()),
      quantity: v.number(), // countable stock; 1 for exclusive venues
      exclusive: v.boolean(), // true = cannot double-book the same slot
      condition: v.optional(v.string()),
      notes: v.optional(v.string()),
      active: v.boolean(),
      createdBy: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_club", ["clubId"]),

    reservations: defineTable({
      resourceId: v.id("resources"),
      eventId: v.optional(v.id("events")),
      clubId: v.id("clubs"),
      quantity: v.number(),
      startAt: v.number(),
      endAt: v.number(),
      reservedBy: v.id("users"),
      status: v.union(
        v.literal("confirmed"),
        v.literal("pending"),
        v.literal("returned"),
        v.literal("cancelled"),
      ),
      note: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_resource", ["resourceId"])
      .index("by_event", ["eventId"]),

    // Internal notes on tasks (organizer-visible only).
    taskComments: defineTable({
      taskId: v.id("tasks"),
      authorId: v.id("users"),
      authorName: v.string(),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_task", ["taskId"]),

    // Post-event feedback. When anonymous, userId is deliberately NOT stored.
    feedback: defineTable({
      eventId: v.id("events"),
      clubId: v.id("clubs"),
      userId: v.optional(v.id("users")), // deliberately absent when anonymous
      rating: v.number(),
      venueRating: v.optional(v.number()),
      orgRating: v.optional(v.number()),
      suggestion: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_event", ["eventId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
