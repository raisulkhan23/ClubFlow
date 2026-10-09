/**
 * 9th DRMC International Tech Carnival 2026 — authoritative fest schedule.
 *
 * Source of truth: the official published schedule (three day sheets).
 * Every entry below is transcribed verbatim: 69 daily schedule entries across
 * 8, 9 and 10 October 2026 (13 + 27 + 29), including the two Lunch Break
 * schedule blocks. Nothing here is generated, randomised or redistributed.
 *
 * Times are Bangladesh Standard Time (Asia/Dhaka, UTC+06:00). They are stored
 * as epoch milliseconds for an instant that is 06:00 behind the Dhaka wall
 * clock, and must always be rendered back in Asia/Dhaka — never in the
 * viewer's local timezone.
 *
 * IMPORTANT: competitions that appear on several days are intentionally NOT
 * merged. Each day sheet is a separate schedule entry with its own window,
 * linked to its parent competition through `seriesKey`.
 */

export const FEST = {
  key: "drmc-tc-2026",
  name: "9th DRMC International Tech Carnival 2026",
  shortName: "DRMC Tech Carnival 2026",
  clubName: "DRMC IT CLUB",
  institution: "DRMC",
  sponsor: "SERVICENIN.COM",
  scheduleTitle: "Event Schedule",
  timeZone: "Asia/Dhaka",
  /** UTC+06:00 — Bangladesh Standard Time, no DST. */
  utcOffsetHours: 6,
  startsOn: "2026-10-08",
  endsOn: "2026-10-10",
} as const;

export const FEST_DAY_KEYS = ["2026-10-08", "2026-10-09", "2026-10-10"] as const;
export type FestDayKey = (typeof FEST_DAY_KEYS)[number];

/** Competition | ceremony | non-registrable schedule block (lunch). */
export type ScheduleKind = "competition" | "ceremony" | "break";

export type ScheduleEntry = {
  day: FestDayKey;
  title: string;
  start: string;
  end: string;
  kind: ScheduleKind;
  category: string;
};

const D1: FestDayKey = "2026-10-08";
const D2: FestDayKey = "2026-10-09";
const D3: FestDayKey = "2026-10-10";

/**
 * The 69 official entries, in day-sheet order.
 *
 * Categories are a deterministic mapping onto the product's taxonomy (see
 * FEST_CATEGORIES below); they are not part of the source schedule and are
 * never used to change a title, date or time.
 */
export const FEST_SCHEDULE: ScheduleEntry[] = [
  // ── 8 October 2026 — 13 entries ─────────────────────────────────────────
  { day: D1, title: "Opening Ceremony", start: "11:00 AM", end: "1:00 PM", kind: "ceremony", category: "Ceremony" },
  { day: D1, title: "Arcane Draw", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D1, title: "Chess Showdown", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D1, title: "Gaming Quiz", start: "2:30 PM", end: "3:00 PM", kind: "competition", category: "Quiz" },
  { day: D1, title: "Crack the Code", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Technology" },
  { day: D1, title: "eFootball Tournament", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D1, title: "Clash Royale Tournament", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D1, title: "Tech Conference", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Technology" },
  { day: D1, title: "Digital Art Exhibition", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D1, title: "Mobile Photography Exhibition", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D1, title: "Poster Design Exhibition", start: "2:30 PM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D1, title: "Robo Quiz", start: "3:15 PM", end: "3:45 PM", kind: "competition", category: "Quiz" },
  { day: D1, title: "Pop Sci-Fi Quiz", start: "4:00 PM", end: "4:30 PM", kind: "competition", category: "Quiz" },

  // ── 9 October 2026 — 27 entries ─────────────────────────────────────────
  { day: D2, title: "Project Display", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Technology" },
  { day: D2, title: "Scrapbook", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D2, title: "Wall Magazine", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D2, title: "Website Showcase", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Technology" },
  { day: D2, title: "App Showcase", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Technology" },
  { day: D2, title: "Robo Soccer", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Robotics" },
  { day: D2, title: "Digital Art Exhibition", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D2, title: "Mobile Photography Exhibition", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D2, title: "Arcane Draw", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D2, title: "Chess Showdown", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D2, title: "Poster Design Exhibition", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Design" },
  { day: D2, title: "Valorant Cup", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D2, title: "FC 26 Tournament", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D2, title: "FI Tournament", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D2, title: "Minecraft PVP Duel", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D2, title: "eFootball Tournament", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D2, title: "Clash Royale Tournament", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Gaming" },
  { day: D2, title: "Tech Conference", start: "9:00 AM", end: "5:00 PM", kind: "competition", category: "Technology" },
  { day: D2, title: "Buzzer Quiz (Preli.)", start: "10:45 AM", end: "11:00 AM", kind: "competition", category: "Quiz" },
  { day: D2, title: "Informatics Olympiad", start: "10:45 AM", end: "11:15 AM", kind: "competition", category: "Technology" },
  { day: D2, title: "Potterhead Quiz", start: "11:30 AM", end: "12:00 PM", kind: "competition", category: "Quiz" },
  { day: D2, title: "TV Series Quiz", start: "12:15 PM", end: "12:45 PM", kind: "competition", category: "Quiz" },
  { day: D2, title: "Lunch Break", start: "1:00 PM", end: "2:00 PM", kind: "break", category: "Break" },
  { day: D2, title: "Buzzer Quiz Final Round", start: "2:00 PM", end: "3:00 PM", kind: "competition", category: "Quiz" },
  { day: D2, title: "TechQuest Hunt (Preli.)", start: "2:00 PM", end: "3:00 PM", kind: "competition", category: "Technology" },
  { day: D2, title: "Google It", start: "3:00 PM", end: "3:30 PM", kind: "competition", category: "Quiz" },
  { day: D2, title: "StarrBuzz", start: "4:00 PM", end: "5:00 PM", kind: "competition", category: "Quiz" },

  // ── 10 October 2026 — 29 entries ────────────────────────────────────────
  { day: D3, title: "Project Display", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Technology" },
  { day: D3, title: "Scrapbook", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Design" },
  { day: D3, title: "Wall Magazine", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Design" },
  { day: D3, title: "Website Showcase", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Technology" },
  { day: D3, title: "App Showcase", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Technology" },
  { day: D3, title: "Line Following Robot", start: "9:00 AM", end: "12:00 PM", kind: "competition", category: "Robotics" },
  { day: D3, title: "Digital Art Exhibition", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Design" },
  // The 10 October sheet labels this "Mobile Photography" (no "Exhibition").
  // Preserved verbatim and deliberately treated as its own series.
  { day: D3, title: "Mobile Photography", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Design" },
  { day: D3, title: "Poster Design Exhibition", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Design" },
  { day: D3, title: "eFootball Tournament", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "Clash Royale Tournament", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "Tech Conference", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Technology" },
  { day: D3, title: "Arcane Draw", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Design" },
  { day: D3, title: "Chess Showdown", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "Valorant Cup", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "FC 26 Tournament", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "FI Tournament", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "Minecraft PVP Duel", start: "9:00 AM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "Programming Contest Final Round", start: "10:00 AM", end: "2:00 PM", kind: "competition", category: "Technology" },
  { day: D3, title: "TechQuest Hunt (Final)", start: "10:00 AM", end: "1:00 PM", kind: "competition", category: "Technology" },
  { day: D3, title: "Team Quiz", start: "10:00 AM", end: "10:30 AM", kind: "competition", category: "Quiz" },
  { day: D3, title: "FIFA Fiesta", start: "10:45 AM", end: "11:15 AM", kind: "competition", category: "Quiz" },
  { day: D3, title: "IQ Olympiad", start: "11:30 AM", end: "12:00 PM", kind: "competition", category: "Quiz" },
  { day: D3, title: "Mini Soccer", start: "12:00 PM", end: "4:00 PM", kind: "competition", category: "Gaming" },
  { day: D3, title: "Anime Quiz", start: "12:15 PM", end: "12:45 PM", kind: "competition", category: "Quiz" },
  { day: D3, title: "Lunch Break", start: "1:00 PM", end: "2:00 PM", kind: "break", category: "Break" },
  { day: D3, title: "Marvel DC Quiz", start: "2:00 PM", end: "2:30 PM", kind: "competition", category: "Quiz" },
  { day: D3, title: "Celebrity Buzz", start: "2:00 PM", end: "3:00 PM", kind: "competition", category: "Quiz" },
  { day: D3, title: "Prize Giving Ceremony", start: "4:00 PM", end: "5:30 PM", kind: "ceremony", category: "Ceremony" },
];

/** Categories the fest schedule needs in addition to the product's existing set. */
export const FEST_CATEGORIES = ["Quiz", "Ceremony", "Break"] as const;

// ── Time helpers ─────────────────────────────────────────────────────────────

const OFFSET_MS = FEST.utcOffsetHours * 3_600_000;
export const HOUR_MS = 3_600_000;
export const MINUTE_MS = 60_000;

/** "2:30 PM" | "11:00 AM" | "12:15 PM" → minutes past midnight (0–1439). */
export function parseClock(time: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!m) throw new Error(`Unparseable schedule time: "${time}"`);
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const meridiem = m[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    throw new Error(`Out-of-range schedule time: "${time}"`);
  }
  if (meridiem === "AM") hour = hour === 12 ? 0 : hour;
  else hour = hour === 12 ? 12 : hour + 12;
  return hour * 60 + minute;
}

/** Minutes past midnight → "2:30 PM". */
export function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, "0");
  const meridiem = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${meridiem}`;
}

/** "2026-10-08" → [2026, 10, 8]. */
export function splitDayKey(dayKey: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) throw new Error(`Bad day key: ${dayKey}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Dhaka wall-clock time on a fest day → the epoch instant.
 *
 * `Date.UTC(2026, 9, 8, 11, 0)` is 11:00 UTC, i.e. 17:00 in Dhaka. Subtracting
 * the +06:00 offset leaves an instant whose Dhaka wall clock is 11:00 — which is
 * what every renderer downstream must use (see `dhakaParts`).
 */
export function dhakaTime(dayKey: string, minutesPastMidnight: number): number {
  const [y, m, d] = splitDayKey(dayKey);
  const hours = Math.floor(minutesPastMidnight / 60);
  const minutes = minutesPastMidnight % 60;
  return Date.UTC(y, m - 1, d, hours, minutes) - OFFSET_MS;
}

/** A schedule entry's start/end instants. */
export function entryWindow(entry: ScheduleEntry): { startAt: number; endAt: number } {
  const startAt = dhakaTime(entry.day, parseClock(entry.start));
  const endAt = dhakaTime(entry.day, parseClock(entry.end));
  return { startAt, endAt };
}

/**
 * Break an instant into its Dhaka calendar parts.
 *
 * Rendering must go through this (or `formatClock`) rather than the browser's
 * local date arithmetic, otherwise a 9:00 AM Dhaka session shows as the previous
 * day for anyone west of UTC+06:00.
 */
export function dhakaParts(ts: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayKey: string;
} {
  const shifted = new Date(ts + OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  return {
    year,
    month,
    day,
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    dayKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

/** The Dhaka calendar day an instant falls on, e.g. "2026-10-08". */
export function dhakaDayKey(ts: number): string {
  return dhakaParts(ts).dayKey;
}

/** "2026-10-09" → "9 October 2026". */
export function festDayLabel(dayKey: string): string {
  const [y, m, d] = splitDayKey(dayKey);
  const month = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][m - 1];
  return `${d} ${month} ${y}`;
}

/** 1-based day number within the fest, e.g. "Day 1". */
export function festDayNumber(dayKey: string): number {
  const idx = FEST_DAY_KEYS.indexOf(dayKey as FestDayKey);
  return idx >= 0 ? idx + 1 : 0;
}

/** "2:30 PM – 5:00 PM" using the authoritative strings. */
export function entryTimeLabel(entry: ScheduleEntry): string {
  return `${entry.start} – ${entry.end}`;
}

/** URL/key-safe slug. Keeps "(Preli.)" → "preli", "FC 26" → "fc-26". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parent-competition identity for a daily entry.
 *
 * Derived from the title exactly as published, so "Mobile Photography
 * Exhibition" and "Mobile Photography" stay separate series — the day sheets
 * label them differently and they must not be silently merged.
 */
export function seriesKeyOf(title: string): string {
  return slugify(title);
}

/**
 * Stable identity for one daily schedule entry: fest + date + competition.
 * Names alone are never unique because the same competition repeats on
 * different days, so the date is part of the key.
 */
export function scheduleSlug(dayKey: string, title: string): string {
  return `${FEST.key}-${dayKey}-${seriesKeyOf(title)}`;
}

/** Schedule-only blocks (lunch) are never registrable. */
export function isRegistrable(entry: ScheduleEntry): boolean {
  return entry.kind === "competition";
}

/** Every session of a competition, chronological. */
export function seriesSessions(title: string): ScheduleEntry[] {
  const key = seriesKeyOf(title);
  return FEST_SCHEDULE.filter((e) => seriesKeyOf(e.title) === key).sort(
    (a, b) => entryWindow(a).startAt - entryWindow(b).startAt,
  );
}

/** Which fest day sheet (if any) an instant belongs to. */
export function festDayKeyOf(ts: number): FestDayKey | null {
  const key = dhakaDayKey(ts);
  return FEST_DAY_KEYS.includes(key as FestDayKey) ? (key as FestDayKey) : null;
}

/** The Dhaka calendar day an instant falls on, as a `YYYY-MM-DD` string.
 *
 * Same computation as `dhakaDayKey`, exported so the event detail page can show
 * the authoritative fest day label without re-deriving it from the browser's
 * local date.
 */
export function dhakaDayOf(ts: number): string {
  return dhakaDayKey(ts);
}

/** Lifecycle phase derived from real times — never stored, so it cannot go stale. */
export type SessionPhase = "upcoming" | "live" | "finished";
export function sessionPhase(startAt: number, endAt: number, now: number = Date.now()): SessionPhase {
  if (now < startAt) return "upcoming";
  if (now <= endAt) return "live";
  return "finished";
}

/** Fixture counts, used by the seeder's self-check. */
export const EXPECTED_ENTRY_COUNT = FEST_SCHEDULE.length;
export const EXPECTED_ENTRIES_PER_DAY: Record<FestDayKey, number> = {
  "2026-10-08": FEST_SCHEDULE.filter((e) => e.day === "2026-10-08").length,
  "2026-10-09": FEST_SCHEDULE.filter((e) => e.day === "2026-10-09").length,
  "2026-10-10": FEST_SCHEDULE.filter((e) => e.day === "2026-10-10").length,
};
