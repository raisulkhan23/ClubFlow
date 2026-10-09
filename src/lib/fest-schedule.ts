export const FEST = {
  key: "drmc-tech-carnival",
  name: "Tech Carnival",
  clubName: "DRMC IT Club",
  institution: "Dhaka Residential Model College",
  scheduleTitle: "DRMC Tech Carnival 2025",
  sponsor: "DRMC IT Club",
  timeZone: "Asia/Dhaka",
};

export type FestDayKey = "day1" | "day2" | "day3";

export interface ScheduleEntry {
  day: FestDayKey;
  title: string;
  start: string;
  end: string;
  sessions?: Array<{ start: string; end: string; title: string; description?: string }>;
}

export const FEST_DAY_KEYS: FestDayKey[] = ["day1", "day2", "day3"];

export const FEST_SCHEDULE: Record<FestDayKey, ScheduleEntry> = {
  day1: { day: "day1", title: "Day 1", start: "09:00", end: "17:00", sessions: [] },
  day2: { day: "day2", title: "Day 2", start: "09:00", end: "17:00", sessions: [] },
  day3: { day: "day3", title: "Day 3", start: "09:00", end: "17:00", sessions: [] },
};

export const festDayKeyOf = (dayNo: number): FestDayKey | undefined => {
  if (dayNo === 1) return "day1";
  if (dayNo === 2) return "day2";
  if (dayNo === 3) return "day3";
  return undefined;
};

export const festDayLabel = (dayKey: FestDayKey) => {
  return FEST_SCHEDULE[dayKey]?.title ?? dayKey;
};

export const festDayNumber = (dayKey: FestDayKey) => {
  if (dayKey === "day1") return 1;
  if (dayKey === "day2") return 2;
  if (dayKey === "day3") return 3;
  return 0;
};

export const seriesKeyOf = (title: string) => title;

export const seriesSessions = (entry: ScheduleEntry | undefined) => entry?.sessions ?? [];

export const scheduleSlug = (dayKey: FestDayKey, title: string) => `${FEST.key}-${dayKey}-${title}`;

export const entryWindow = (entry: ScheduleEntry) => ({
  startAt: new Date(`2025-01-01T${entry.start}:00`),
  endAt: new Date(`2025-01-01T${entry.end}:00`),
});

export const EXPECTED_ENTRIES_PER_DAY: Record<FestDayKey, number> = {
  day1: 30,
  day2: 30,
  day3: 30,
};

export const EXPECTED_ENTRY_COUNT = 90;

export const dhakaDayOf = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.getUTCDate();
};

export const dhakaDayKey = (timestamp: number) => {
  return String(timestamp);
};

export const dhakaTime = (timestamp: number) => {
  return new Date(timestamp).toISOString();
};
