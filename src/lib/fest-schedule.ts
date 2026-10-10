export const FEST = {
  key: "drmc-tech-carnival",
  name: "Tech Carnival",
  clubName: "DRMC IT Club",
  institution: "Dhaka Residential Model College",
  scheduleTitle: "DRMC Tech Carnival 2026",
  sponsor: "DRMC IT Club",
  timeZone: "Asia/Dhaka",
};

export type FestDayKey = "day1" | "day2" | "day3";

export type ScheduleKind = "competition" | "ceremony" | "break";

export interface ScheduleSession {
  start: string;
  end: string;
  day: FestDayKey;
  title: string;
  description?: string;
}

export interface ScheduleEntry {
  day: FestDayKey;
  title: string;
  start: string;
  end: string;
  /** "competition" is registrable; "ceremony"/"break" are schedule blocks. */
  kind?: ScheduleKind;
  /** Maps onto the schema's category union. */
  category?: string;
  /** Every slot this competition occupies, across days (1–3). */
  sessions?: ScheduleSession[];
}

export const FEST_DAY_KEYS: FestDayKey[] = ["day1", "day2", "day3"];

/**
 * The authoritative 9th DRMC International Tech Carnival 2026 schedule.
 * One row per fest-day slot: [day, title, start, end, kind, category].
 * A competition that runs on several days repeats its title on each day —
 * identity is always day + title, never the name alone.
 */
type Slot = readonly [FestDayKey, string, string, string, ScheduleKind, string?];

const SLOTS: Slot[] = [
  // ── Day 1 ────────────────────────────────────────────────────────────────
  ["day1", "Opening Ceremony", "09:00", "09:30", "ceremony", "Ceremony"],
  ["day1", "AI Web Development Contest", "09:30", "11:30", "competition", "Technology"],
  ["day1", "Robo Quiz (Preli.)", "09:30", "11:30", "competition", "Quiz"],
  ["day1", "Coding Sprint (Preli.)", "09:30", "11:00", "competition", "Technology"],
  ["day1", "UI/UX Design Sprint", "09:30", "11:00", "competition", "Design"],
  ["day1", "Logic Maze", "09:30", "11:00", "competition", "Technology"],
  ["day1", "IT Quiz (Preli.)", "09:30", "10:30", "competition", "Quiz"],
  ["day1", "Photography Challenge", "09:30", "11:30", "competition", "Design"],
  ["day1", "Lunch Break", "11:30", "12:30", "break", "Break"],
  ["day1", "Coding Sprint (Semi)", "11:15", "12:45", "competition", "Technology"],
  ["day1", "Poster Match", "11:15", "12:30", "competition", "Design"],
  ["day1", "Rapid Fire Quiz", "11:15", "12:30", "competition", "Quiz"],
  ["day1", "Robo Quiz (Semi)", "11:45", "12:45", "competition", "Quiz"],
  ["day1", "Programming Contest (Preli.)", "12:00", "14:00", "competition", "Technology"],
  ["day1", "Poster Jam", "12:45", "13:45", "competition", "Design"],
  ["day1", "Hack Sprint", "12:45", "14:15", "competition", "Technology"],
  ["day1", "E-Sports Qualifier", "13:00", "14:30", "competition", "Gaming"],
  ["day1", "Debate Round 1", "13:00", "14:00", "competition", "Cultural"],
  ["day1", "Robotics Challenge (Preli.)", "13:30", "15:00", "competition", "Robotics"],
  ["day1", "Arcane Draw", "13:30", "15:00", "competition", "Gaming"],
  ["day1", "Line Follower Race", "14:15", "15:15", "competition", "Robotics"],
  ["day1", "Chess Showdown", "14:00", "16:00", "competition", "Gaming"],
  ["day1", "Quiz Championship (Preli.)", "14:30", "15:30", "competition", "Quiz"],
  ["day1", "Story Slam", "14:30", "16:00", "competition", "Cultural"],
  ["day1", "App Innovation Pitch", "15:00", "16:30", "competition", "Technology"],
  ["day1", "Capture the Flag", "15:15", "16:15", "competition", "Technology"],
  ["day1", "Music Clash", "15:30", "17:00", "competition", "Cultural"],
  ["day1", "Drone Dash (Preli.)", "15:45", "16:45", "competition", "Robotics"],
  ["day1", "Stand-up Set", "16:00", "17:00", "competition", "Cultural"],
  ["day1", "Gaming Quiz", "16:15", "17:00", "competition", "Quiz"],

  // ── Day 2 ────────────────────────────────────────────────────────────────
  ["day2", "Day 2 Briefing", "09:00", "09:15", "ceremony", "Ceremony"],
  ["day2", "AI Web Development Contest", "09:15", "11:15", "competition", "Technology"],
  ["day2", "Coding Sprint (Final)", "09:15", "11:00", "competition", "Technology"],
  ["day2", "UI/UX Handoff", "09:15", "10:45", "competition", "Design"],
  ["day2", "Robo Quiz (Final)", "09:15", "10:15", "competition", "Quiz"],
  ["day2", "Robotics Challenge (Semi)", "09:15", "11:15", "competition", "Robotics"],
  ["day2", "Poster Clash", "09:15", "10:45", "competition", "Design"],
  ["day2", "IT Quiz (Final)", "09:15", "10:15", "competition", "Quiz"],
  ["day2", "Photo Walk", "09:15", "11:15", "competition", "Design"],
  ["day2", "Game Jam", "09:30", "11:00", "competition", "Gaming"],
  ["day2", "Lunch Break", "11:00", "12:00", "break", "Break"],
  ["day2", "Programming Contest (Semi)", "11:15", "12:45", "competition", "Technology"],
  ["day2", "Debug Duel", "11:15", "12:30", "competition", "Technology"],
  ["day2", "Speed Quiz", "11:15", "12:15", "competition", "Quiz"],
  ["day2", "Data Viz Dash", "11:30", "13:00", "competition", "Technology"],
  ["day2", "E-Sports Semi-Finals", "12:00", "13:30", "competition", "Gaming"],
  ["day2", "Cloud Craft", "12:30", "14:00", "competition", "Technology"],
  ["day2", "Debate Round 2", "12:45", "13:45", "competition", "Cultural"],
  ["day2", "Robo Race", "13:00", "14:00", "competition", "Robotics"],
  ["day2", "Arcane Draw", "13:00", "14:30", "competition", "Gaming"],
  ["day2", "Chess Showdown", "13:15", "14:45", "competition", "Gaming"],
  ["day2", "Quiz Championship (Semi)", "13:45", "15:15", "competition", "Quiz"],
  ["day2", "Poetry Slam", "14:00", "15:30", "competition", "Cultural"],
  ["day2", "Drone Dash (Semi)", "14:30", "16:00", "competition", "Robotics"],
  ["day2", "Band Battle", "15:00", "16:00", "competition", "Cultural"],
  ["day2", "Poster Expo", "15:30", "16:30", "competition", "Design"],
  ["day2", "Capture the Flag (Final)", "15:15", "16:45", "competition", "Technology"],
  ["day2", "Open Mic", "16:00", "17:00", "competition", "Cultural"],
  ["day2", "Gaming Quiz (Final)", "16:15", "17:00", "competition", "Quiz"],
  ["day2", "Line Follower Race (Final)", "16:30", "17:00", "competition", "Robotics"],

  // ── Day 3 ────────────────────────────────────────────────────────────────
  ["day3", "AI Web Development Contest", "09:00", "11:00", "competition", "Technology"],
  ["day3", "Arcane Draw", "09:00", "10:30", "competition", "Gaming"],
  ["day3", "Chess Showdown (Semi)", "09:00", "10:30", "competition", "Gaming"],
  ["day3", "Quiz Championship (Final)", "09:00", "10:00", "competition", "Quiz"],
  ["day3", "Robotics Challenge (Final)", "09:00", "10:30", "competition", "Robotics"],
  ["day3", "Coding Sprint (Showcase)", "09:00", "10:00", "competition", "Technology"],
  ["day3", "UI/UX Showcase", "09:00", "10:00", "competition", "Design"],
  ["day3", "E-Sports Finals", "09:00", "10:30", "competition", "Gaming"],
  ["day3", "Lunch Break", "10:30", "11:30", "break", "Break"],
  ["day3", "Programming Contest (Final)", "10:45", "12:15", "competition", "Technology"],
  ["day3", "IT Quiz (Championship)", "10:45", "11:45", "competition", "Quiz"],
  ["day3", "Drone Dash (Final)", "10:45", "12:15", "competition", "Robotics"],
  ["day3", "Poster Masters", "10:45", "11:45", "competition", "Design"],
  ["day3", "Battle of Bands", "11:00", "12:00", "competition", "Cultural"],
  ["day3", "App Innovation (Final)", "11:30", "13:00", "competition", "Technology"],
  ["day3", "Rapid Fire (Grand Final)", "11:45", "12:45", "competition", "Quiz"],
  ["day3", "Debate Final", "12:00", "13:00", "competition", "Cultural"],
  ["day3", "Robo Sumo", "12:30", "13:30", "competition", "Robotics"],
  ["day3", "Chess Showdown (Final)", "12:30", "14:00", "competition", "Gaming"],
  ["day3", "Hackathon Demo Day", "12:45", "14:15", "competition", "Technology"],
  ["day3", "Stand-up Grand Final", "13:00", "14:00", "competition", "Cultural"],
  ["day3", "Gaming Quiz (Grand Final)", "13:15", "14:45", "competition", "Quiz"],
  ["day3", "Capture the Flag (Grand Final)", "13:45", "15:15", "competition", "Technology"],
  ["day3", "Talent Showcase", "14:00", "15:00", "competition", "Cultural"],
  ["day3", "Photo Awards", "14:15", "15:15", "ceremony", "Ceremony"],
  ["day3", "Robo Race (Final)", "14:45", "15:45", "competition", "Robotics"],
  ["day3", "Quiz Championship (Grand Final)", "15:15", "16:15", "competition", "Quiz"],
  ["day3", "Prize Giving Ceremony", "15:30", "16:30", "ceremony", "Ceremony"],
  ["day3", "Closing Ceremony", "16:00", "17:00", "ceremony", "Ceremony"],
  ["day3", "Farewell Circle", "16:30", "17:00", "break", "Break"],
];

/** Day-level headers, used for labels and the day selector only. */
export const FEST_SCHEDULE: Record<FestDayKey, ScheduleEntry> = {
  day1: { day: "day1", title: "Day 1", start: "09:00", end: "17:00", sessions: [], kind: "break" },
  day2: { day: "day2", title: "Day 2", start: "09:00", end: "17:00", sessions: [], kind: "break" },
  day3: { day: "day3", title: "Day 3", start: "09:00", end: "17:00", sessions: [], kind: "break" },
};

/** URL-safe slug fragment for a competition name ("UI/UX" → "ui-ux"). */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function buildEntries(): ScheduleEntry[] {
  const byTitle = new Map<string, Slot[]>();
  for (const slot of SLOTS) {
    const list = byTitle.get(slot[1]) ?? [];
    list.push(slot);
    byTitle.set(slot[1], list);
  }
  return SLOTS.map(([day, title, start, end, kind, category]) => ({
    day,
    title,
    start,
    end,
    kind,
    category,
    sessions: (byTitle.get(title) ?? []).map(([d, t, st, en]) => ({
      day: d,
      title: t,
      start: st,
      end: en,
    })),
  }));
}

/** Every schedule slot of the fest, in order. This is what the seeder writes. */
export const SCHEDULE_ENTRIES: ScheduleEntry[] = buildEntries();

/** Which fest day a real timestamp falls on, by its Asia/Dhaka calendar date. */
export const festDayKeyOf = (timestamp: number): FestDayKey | undefined => {
  const key = dhakaDayKey(timestamp);
  for (const day of FEST_DAY_KEYS) {
    if (FEST_DATES[day] === key) return day;
  }
  return undefined;
};

/**
 * Which fest day a persisted event belongs to, decoded from its stable slug
 * (`drmc-tech-carnival-day3-...`). Slugs encode the day at seed time, so this
 * stays correct even while old rows still carry placeholder (2000-01-01)
 * timestamps — those map to no fest date via festDayKeyOf and would otherwise
 * be dropped by day filters.
 */
export const festDayFromSlug = (slug: string): FestDayKey | undefined => {
  for (const day of FEST_DAY_KEYS) {
    if (slug.includes(`-${day}-`)) return day;
  }
  return undefined;
};

export const festDayLabel = (dayKey: FestDayKey | string) => {
  return FEST_SCHEDULE[dayKey as FestDayKey]?.title ?? dayKey;
};

export const festDayNumber = (dayKey: FestDayKey) => {
  if (dayKey === "day1") return 1;
  if (dayKey === "day2") return 2;
  if (dayKey === "day3") return 3;
  return 0;
};

export const seriesKeyOf = (title: string) => title;

export const seriesSessions = (entry: ScheduleEntry | undefined) => entry?.sessions ?? [];

/** How many fest days one competition spans, by its schedule title. */
export function seriesDayCount(title: string): number {
  const days = new Set<string>();
  for (const entry of SCHEDULE_ENTRIES) if (entry.title === title) days.add(entry.day);
  return days.size;
}

export const scheduleSlug = (dayKey: FestDayKey, title: string) =>
  `${FEST.key}-${dayKey}-${slugify(title)}`;

/** Real calendar dates of the fest's three days (Asia/Dhaka local dates). */
export const FEST_DATES: Record<FestDayKey, string> = {
  day1: "2026-10-08",
  day2: "2026-10-09",
  day3: "2026-10-10",
};

// Dhaka is UTC+6 with no DST, so local wall-clock `HH:MM` maps to UTC = local − 6h.
const DHAKA_OFFSET_MS = 6 * 60 * 60_000;

/** Absolute start/end instants for a schedule entry, on its real fest date. */
export const entryWindow = (entry: ScheduleEntry) => {
  const date = FEST_DATES[entry.day];
  // Dhaka local wall-clock = UTC + 6h (no DST), so UTC instant = wall time − 6h.
  const toInstant = (hhmm: string) =>
    new Date(`${date}T${hhmm}:00+00:00`).getTime() - DHAKA_OFFSET_MS;
  return {
    startAt: new Date(toInstant(entry.start)),
    endAt: new Date(toInstant(entry.end)),
  };
};

/**
 * Expected counts are derived from the schedule table itself, so the seeding
 * check can never drift out of sync with the data it validates.
 */
export const EXPECTED_ENTRIES_PER_DAY: Record<FestDayKey, number> = SLOTS.reduce(
  (acc, [day]) => ({ ...acc, [day]: (acc[day] ?? 0) + 1 }),
  { day1: 0, day2: 0, day3: 0 } as Record<FestDayKey, number>,
);

export const EXPECTED_ENTRY_COUNT = SLOTS.length;

export const dhakaDayOf = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.getUTCDate();
};

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Stable grouping key: the calendar day in Asia/Dhaka (e.g. "2026-10-06"). */
export const dhakaDayKey = (timestamp: number) =>
  dayKeyFormatter.format(new Date(timestamp));

export const dhakaTime = (timestamp: number) => {
  return new Date(timestamp).toISOString();
};
