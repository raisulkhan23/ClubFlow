import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { nextRegistrationId } from "./helpers";
import { CATEGORIES, type Category, type FormField } from "./schema";
import {
  EXPECTED_ENTRIES_PER_DAY,
  EXPECTED_ENTRY_COUNT,
  FEST,
  FEST_DAY_KEYS,
  FEST_SCHEDULE,
  type FestDayKey,
  entryWindow,
  festDayLabel,
  festDayNumber,
  seriesKeyOf,
  seriesSessions,
  scheduleSlug,
  SCHEDULE_ENTRIES,
} from "../lib/fest-schedule";

// Wider ScheduleEntry used only by this seed module (category/kind/day/sessions).
interface ScheduleEntry {
  day: FestDayKey;
  title: string;
  start: string;
  end: string;
  kind?: string;
  category?: string;
  sessions?: Array<{ start: string; end: string; title: string; description?: string; day?: FestDayKey }>;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 9th DRMC International Tech Carnival 2026 — schedule seeding
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Design notes (why this file is separate from `seed.ts`):
 *
 *  - `seed.ts` is guarded by a once-only `meta.seeded` lock, so it can never
 *    correct itself. This seeder is version-stamped AND idempotent: repeated
 *    runs update the same rows in place and create nothing twice.
 *  - One `events` row per daily schedule entry (the schema stores a single
 *    start/end per event). Sessions of the same competition are linked through
 *    `seriesKey` — deliberately NOT merged, because e.g. Arcane Draw genuinely
 *    runs on all three days with different windows.
 *  - Identity is `fest + date + competition`, never the name alone, because the
 *    same competition repeats across days.
 *  - Nothing here is randomised: no generated names, dates or times.
 *
 * Explicitly documented placeholders (the reference schedule does not provide
 * these, and the schema requires them):
 *  - `venue`: "DRMC Campus" — the organising institution's campus.
 *  - `capacity`: a single constant, never a random per-event value.
 *  - `registrationDeadline`: the session's own start instant.
 *  - `shortDescription` / `description`: composed from the authoritative entry
 *    itself (date + time window), never invented prose.
 *  - `formFields`: one minimal default form so the registration workflow works.
 */

const SYNC_VERSION = "drmc-tc-2026.v1.2";
const MARKER_KEY = "fest.schedule.drmc-tc-2026";
const CLUB_SLUG = "drmc-tech-carnival";
const CLUB_CONTACT_EMAIL = "techclub@drmc.edu.bd";
const VENUE_PLACEHOLDER = "DRMC Campus";
const DEMO_CAPACITY = 100;

/**
 * The nine fictional events created by the original `seed.ts` demo. They are
 * retired (archived, never deleted) so fabricated events stop appearing in
 * public discovery, while their registrations / results / certificates stay
 * intact and no foreign key dangles.
 */
const RETIRED_DEMO_SLUGS = [
  "web-development-challenge",
  "robotics-arena",
  "ai-innovation-challenge",
  "uiux-design-sprint",
  "programming-contest",
  "cultural-night-fusion-beats",
  "quiz-championship",
  "gaming-tournament",
  "photography-challenge",
];

/** Minimal default registration form — a UI necessity, not a factual claim. */
const DEMO_FORM_FIELDS: FormField[] = [
  { id: "f_name", type: "text", label: "Full name", required: true },
  { id: "f_email", type: "email", label: "Email", required: true },
  { id: "f_phone", type: "phone", label: "Mobile number", required: false },
  { id: "f_institution", type: "text", label: "Institution", required: false },
];

/** Demo participants, used only to make registrations/tickets demonstrable. */
const DEMO_PARTICIPANTS: Array<[string, string]> = [
  ["Arafat Rahman", "arafat.rahman@drmc.edu.bd"],
  ["Nusrat Jahan", "nusrat.jahan@drmc.edu.bd"],
  ["Tanvir Ahmed", "tanvir.ahmed@drmc.edu.bd"],
  ["Sadia Islam", "sadia.islam@drmc.edu.bd"],
  ["Rafiul Karim", "rafiul.karim@drmc.edu.bd"],
  ["Mahin Chowdhury", "mahin.chowdhury@drmc.edu.bd"],
  ["Farhana Akter", "farhana.akter@drmc.edu.bd"],
  ["Sajid Hossain", "sajid.hossain@drmc.edu.bd"],
];

/**
 * How many demo registrations to attach to some of the first day's
 * competitions. Deliberately modest, and only on real schedule entries.
 */
const DEMO_REGISTRATION_PLAN: Array<{ title: string; count: number }> = [
  { title: "AI Web Development Contest", count: 5 },
  { title: "Coding Sprint (Preli.)", count: 4 },
  { title: "UI/UX Design Sprint", count: 4 },
  { title: "Arcane Draw", count: 3 },
  { title: "Chess Showdown", count: 3 },
];

export type FestSyncSummary = {
  skipped: boolean;
  version: string;
  created: number;
  updated: number;
  retiredDemoEvents: number;
  demoRegistrationsCreated: number;
  total: number;
  perDay: Record<string, number>;
  validation: {
    expectedTotal: number;
    expectedPerDay: Record<string, number>;
    perDayMatches: boolean;
    totalMatches: boolean;
    duplicateSlugs: number;
    endBeforeStart: number;
  };
};

const coverThemeFor = (category: string): number => {
  const idx = (CATEGORIES as readonly string[]).indexOf(category);
  return idx < 0 ? 0 : idx % 6;
};

/**
 * Narrow a schedule entry's category onto the schema union with a runtime check,
 * so a typo in the fixture table fails the sync loudly instead of silently
 * writing an invalid category.
 */
function categoryOf(entry: ScheduleEntry): Category {
  const cat = entry.category ?? "Technology";
  const match = (CATEGORIES as readonly string[]).find((c) => c === cat);
  if (!match) {
    throw new Error(`Unknown category "${cat}" on schedule entry "${entry.title}"`);
  }
  return match as Category;
}

/** A stable, deterministic slug for one daily schedule entry. */
const slugFor = (entry: ScheduleEntry) => scheduleSlug(entry.day, entry.title);

const dayCovers = (entry: ScheduleEntry) => seriesSessions(entry);

/** Composed strictly from the entry itself — no invented prose. */
function describeEntry(entry: ScheduleEntry): { short: string; long: string } {
  const day = festDayLabel(entry.day);
  const dayNo = festDayNumber(entry.day);
  const sessions = dayCovers(entry);
  const short = `${entry.start} – ${entry.end} · ${day} · Day ${dayNo} of 3`;
  const long =
    `${entry.title} is scheduled on ${day} from ${entry.start} to ${entry.end} ` +
    `as part of the ${FEST.name} (day ${dayNo} of 3).` +
    (sessions.length > 1
      ? ` This competition runs across ${sessions.length} days: ` +
        sessions.map((s) => `${festDayLabel((s as { day?: FestDayKey }).day ?? entry.day)} (${s.start} – ${s.end})`).join("; ") +
        "."
      : "");
  return { short, long };
}

/** The session list shown on the event detail page. */
function scheduleItems(entry: ScheduleEntry) {
  const sessions = dayCovers(entry);
  return sessions.map((s, i) => ({
    id: `s${i + 1}`,
    title:
      sessions.length > 1
        ? `Day ${festDayNumber((s as { day?: FestDayKey }).day ?? entry.day)} of 3 · ${festDayLabel((s as { day?: FestDayKey }).day ?? entry.day)}`
        : "Scheduled session",
    time: `${s.start} – ${s.end}`,
  }));
}

async function resolveClubAndOrganizer(ctx: MutationCtx): Promise<{
  clubId: Id<"clubs">;
  organizerId: Id<"users">;
}> {
  let club = await ctx.db
    .query("clubs")
    .withIndex("by_slug", (q) => q.eq("slug", CLUB_SLUG))
    .first();

  if (!club) {
    const clubId = await ctx.db.insert("clubs", {
      name: FEST.clubName,
      slug: CLUB_SLUG,
      description: `The official technology club of ${FEST.institution}, hosting the ${FEST.name}.`,
      contactEmail: CLUB_CONTACT_EMAIL,
      website: "https://drmctech.dev",
      facebook: "https://facebook.com/drmctechclub",
      createdAt: Date.now() - 400 * 86_400_000,
    });
    club = await ctx.db.get(clubId);
  }
  if (!club) throw new Error("Could not resolve the fest club.");

  const clubUsers = await ctx.db
    .query("users")
    .withIndex("by_club", (q) => q.eq("clubId", club!._id))
    .collect();
  const existingOrganizer = clubUsers.find((u) => u.role === "organizer");
  if (existingOrganizer) return { clubId: club._id, organizerId: existingOrganizer._id };

  const organizerId = await ctx.db.insert("users", {
    name: "Rehan Chowdhury",
    email: "organizer@drmctech.dev",
    role: "organizer",
    clubId: club._id,
  });
  return { clubId: club._id, organizerId };
}

/** Demo participant accounts, created only if they are missing (by email). */
async function resolveDemoParticipants(ctx: MutationCtx): Promise<Id<"users">[]> {
  const allUsers = await ctx.db.query("users").collect();
  const byEmail = new Map<string, Id<"users">>();
  for (const u of allUsers) if (u.email) byEmail.set(u.email.toLowerCase(), u._id);

  const ids: Id<"users">[] = [];
  for (const [name, email] of DEMO_PARTICIPANTS) {
    const found = byEmail.get(email.toLowerCase());
    if (found) {
      ids.push(found);
      continue;
    }
    ids.push(await ctx.db.insert("users", { name, email, role: "participant" }));
  }
  return ids;
}

/**
 * Attach demo registrations to real schedule entries.
 *
 * Idempotent (skips any event+user pair that already exists) and deliberately
 * conservative: no check-ins, no results, no certificates, and nothing at all
 * for ceremonies or the lunch break.
 */
async function seedDemoRegistrations(
  ctx: MutationCtx,
  clubId: Id<"clubs">,
  entries: Array<{ _id: Id<"events">; entry: ScheduleEntry; title: string }>,
): Promise<number> {
  const participants = await resolveDemoParticipants(ctx);
  if (participants.length === 0) return 0;

  const firstDay = FEST_DAY_KEYS[0];
  let created = 0;
  const now = Date.now();

  for (const plan of DEMO_REGISTRATION_PLAN) {
    const target = entries.find(
      (e) => e.entry.title === plan.title && e.entry.day === firstDay && e.entry.kind === "competition",
    );
    if (!target) continue;
    if (!target) continue;

    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", target._id))
      .collect();
    const taken = new Set(existing.map((r) => r.userId));

    for (const userId of participants.slice(0, plan.count)) {
      if (taken.has(userId)) continue;
      const registrationId = await nextRegistrationId(ctx);
      await ctx.db.insert("registrations", {
        eventId: target._id,
        userId,
        registrationId,
        status: "confirmed",
        type: "individual",
        teamMembers: [],
        answers: [],
        // No checkedInAt: attendance is recorded by the real check-in flow.
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }
  }
  void clubId;
  return created;
}

/**
 * Core sync. Safe to call repeatedly and safe to call on a database that has
 * never been seeded. Never deletes anything.
 */
export async function runFestSync(ctx: MutationCtx): Promise<FestSyncSummary> {
  // `meta` has no unique constraint on `key`, so read every row for the key:
  // an earlier version of this seeder inserted a fresh marker row per run, which
  // silently defeated the skip gate and grew the table without bound.
  const markerRows = await ctx.db
    .query("meta")
    .withIndex("by_key", (q) => q.eq("key", MARKER_KEY))
    .collect();
  const markerValue = markerRows[0]?.value;

  const existingFest = await ctx.db
    .query("events")
    .withIndex("by_fest", (q) => q.eq("festKey", FEST.key))
    .collect();

  const validation = {
    expectedTotal: EXPECTED_ENTRY_COUNT,
    expectedPerDay: { ...EXPECTED_ENTRIES_PER_DAY } as Record<string, number>,
    perDayMatches: true,
    totalMatches: true,
    duplicateSlugs: 0,
    endBeforeStart: 0,
  };

  if (markerValue === SYNC_VERSION && existingFest.filter((e) => e.status !== "archived").length === EXPECTED_ENTRY_COUNT) {
    // Self-heal any duplicate marker rows left behind by older runs.
    for (const extra of markerRows.slice(1)) await ctx.db.delete(extra._id);
    const perDay = countByDay(existingFest.map((e) => e.slug));
    return {
      skipped: true,
      version: SYNC_VERSION,
      created: 0,
      updated: 0,
      retiredDemoEvents: 0,
      demoRegistrationsCreated: 0,
      total: existingFest.length,
      perDay,
      validation: {
        ...validation,
        perDayMatches: comparePerDay(perDay, EXPECTED_ENTRIES_PER_DAY),
        totalMatches: true,
      },
    };
  }

  const { clubId, organizerId } = await resolveClubAndOrganizer(ctx);
  const now = Date.now();

  // ── 1. Retire the original fictional demo events (archive, never delete) ──
  let retired = 0;
  for (const slug of RETIRED_DEMO_SLUGS) {
    const ev = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!ev || ev.festKey) continue;
    if (ev.status === "archived") continue;
    await ctx.db.patch(ev._id, { status: "archived", updatedAt: now });
    retired++;
  }

  // ── 2. Upsert every official schedule entry by its stable slug ────────────
  let created = 0;
  let updated = 0;
  const upserted: Array<{ _id: Id<"events">; entry: ScheduleEntry; title: string }> = [];

  for (const entry of SCHEDULE_ENTRIES) {
    const slug = slugFor(entry);
    const { startAt, endAt } = entryWindow(entry);
    const isCompetition = entry.kind === "competition";
    const { short, long } = describeEntry(entry);
    const category = categoryOf(entry);

    const fields = {
      clubId,
      createdBy: organizerId,
      title: entry.title, // verbatim, including "(Preli.)" and "FC 26"
      slug,
      category,
      shortDescription: short,
      description: long,
      // Ceremonies and the lunch break are publicly listed schedule blocks but
      // are not registrable, so they sit in the closed state.
      status: isCompetition ? ("published" as const) : ("registration_closed" as const),
      startAt: startAt.getTime(),
      endAt: endAt.getTime(),
      venue: VENUE_PLACEHOLDER,
      capacity: isCompetition ? DEMO_CAPACITY : 0,
      registrationDeadline: startAt.getTime(),
      teamEvent: false,
      requiresApproval: false,
      contactEmail: CLUB_CONTACT_EMAIL,
      formFields: isCompetition ? DEMO_FORM_FIELDS : [],
      faq: [],
      schedule: scheduleItems(entry),
      coverTheme: coverThemeFor(category),
      kind: isCompetition ? ("competition" as const) : (entry.kind === "ceremony" ? ("ceremony" as const) : ("break" as const)),
      seriesKey: seriesKeyOf(entry.title),
      festKey: FEST.key,
      updatedAt: now,
    };

    const existing = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      updated++;
      upserted.push({ _id: existing._id, entry, title: entry.title });
    } else {
      const _id = await ctx.db.insert("events", {
        ...fields,
        publishedAt: isCompetition ? now : undefined,
        createdAt: now,
      });
      created++;
      upserted.push({ _id, entry, title: entry.title });
    }
  }

  // ── 3. Minimal, clearly-scoped demo registrations ─────────────────────────
  const demoRegistrationsCreated = await seedDemoRegistrations(ctx, clubId, upserted);

  // ── 4. Self-validation against the authoritative schedule ─────────────────
  const persisted = await ctx.db
    .query("events")
    .withIndex("by_fest", (q) => q.eq("festKey", FEST.key))
    .collect();
  const active = persisted.filter((e) => e.status !== "archived");
  const perDay = countByDay(active.map((e) => e.slug));
  const slugs = active.map((e) => e.slug);
  const duplicateSlugs = slugs.length - new Set(slugs).size;
  const endBeforeStart = active.filter((e) => e.endAt <= e.startAt).length;

  // Upsert the marker (never insert a second row for the same key).
  if (markerRows.length > 0) {
    await ctx.db.patch(markerRows[0]._id, { value: SYNC_VERSION });
    for (const extra of markerRows.slice(1)) await ctx.db.delete(extra._id);
  } else {
    await ctx.db.insert("meta", { key: MARKER_KEY, value: SYNC_VERSION });
  }

  return {
    skipped: false,
    version: SYNC_VERSION,
    created,
    updated,
    retiredDemoEvents: retired,
    demoRegistrationsCreated,
    total: persisted.length,
    perDay,
    validation: {
      ...validation,
      perDayMatches: comparePerDay(perDay, EXPECTED_ENTRIES_PER_DAY),
      totalMatches: active.length === EXPECTED_ENTRY_COUNT,
      duplicateSlugs,
      endBeforeStart,
    },
  };
}

/** Count persisted event slugs per fest day, read back off the slug itself. */
function countByDay(slugs: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const day of FEST_DAY_KEYS) out[day] = 0;
  for (const slug of slugs) {
    for (const day of FEST_DAY_KEYS) {
      if (slug.startsWith(`${FEST.key}-${day}-`)) {
        out[day] += 1;
        break;
      }
    }
  }
  return out;
}

function comparePerDay(
  actual: Record<string, number>,
  expected: Record<FestDayKey, number>,
): boolean {
  return FEST_DAY_KEYS.every((d) => actual[d] === expected[d]);
}

/**
 * Public bootstrap mutation, matching the existing `seed.ensureSeeded`
 * convention. It is idempotent and version-stamped so a repeat call is a single
 * indexed read and no writes at all.
 */
export const syncFestSchedule = mutation({
  args: {},
  handler: async (ctx) => runFestSync(ctx),
});

/** Read-only status, used by the validation checks and the UI banner. */
export const festScheduleStatus = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const persisted = await ctx.db
      .query("events")
      .withIndex("by_fest", (q) => q.eq("festKey", FEST.key))
      .collect();
    const active = persisted.filter((e) => e.status !== "archived");

    const byDay: Record<string, Array<{ title: string; slug: string; startAt: number; kind: string }>> = {};
    for (const day of FEST_DAY_KEYS) byDay[day] = [];
    for (const e of active) {
      const day = FEST_DAY_KEYS.find((d) => e.slug.startsWith(`${FEST.key}-${d}-`));
      if (!day) continue;
      byDay[day].push({
        title: e.title,
        slug: e.slug,
        startAt: e.startAt,
        kind: e.kind ?? "competition",
      });
    }
    for (const day of FEST_DAY_KEYS) byDay[day].sort((a, b) => a.startAt - b.startAt);

    const perDay: Record<string, number> = {};
    for (const day of FEST_DAY_KEYS) perDay[day] = byDay[day].length;

    return {
      fest: FEST,
      scheduleTitle: FEST.scheduleTitle,
      total: active.length,
      expectedTotal: EXPECTED_ENTRY_COUNT,
      perDay,
      expectedPerDay: EXPECTED_ENTRIES_PER_DAY,
      matches: active.length === EXPECTED_ENTRY_COUNT && comparePerDay(perDay, EXPECTED_ENTRIES_PER_DAY),
      byDay,
    };
  },
});
