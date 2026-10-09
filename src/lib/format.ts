import { formatDistanceToNowStrict } from "date-fns";
import { FEST } from "./fest-schedule";

/**
 * All fest dates render in Asia/Dhaka (BS T, UTC+06:00), never in the viewer's
 * local timezone.
 *
 * The fest is a physical event in Dhaka. Formatting with `date-fns` `format()`
 * used the browser's zone, so a 9:00 AM Dhaka session displayed as a different
 * time — and could even land on the previous calendar day — for anyone west of
 * UTC+06:00. `Intl.DateTimeFormat` with an explicit `timeZone` is built into the
 * runtime, so this needs no extra dependency and cannot drift with the host.
 *
 * Output strings are deliberately unchanged (`Oct 8, 2026`, `9:00 AM`,
 * `Oct 8, 2026 · 9:00 AM`) so existing layouts keep working.
 */
const TZ = FEST.timeZone;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function fmtDate(ts: number | undefined): string {
  if (!ts) return "—";
  return dateFormatter.format(new Date(ts));
}

export function fmtDateTime(ts: number | undefined): string {
  if (!ts) return "—";
  return `${dateFormatter.format(new Date(ts))} · ${timeFormatter.format(new Date(ts))}`;
}

export function fmtTime(ts: number | undefined): string {
  if (!ts) return "—";
  return timeFormatter.format(new Date(ts));
}

/** "9:00 AM – 5:00 PM" */
export function fmtTimeRange(startAt: number | undefined, endAt: number | undefined): string {
  if (!startAt || !endAt) return "—";
  return `${timeFormatter.format(new Date(startAt))} – ${timeFormatter.format(new Date(endAt))}`;
}

/** "Thursday, October 8, 2026" — used for day-schedule headings. */
export function fmtDayHeading(ts: number | undefined): string {
  if (!ts) return "—";
  return weekdayFormatter.format(new Date(ts));
}

/** Short day heading for chips: "Thu 8 Oct". */
export function fmtDayChip(ts: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(ts));
}

export function fmtRelative(ts: number | undefined): string {
  if (!ts) return "—";
  return formatDistanceToNowStrict(new Date(ts), { addSuffix: true });
}

export function countdown(ts: number, now: number = Date.now()): string {
  const diff = ts - now;
  if (diff <= 0) return "Happening now";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h to go`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m to go`;
  return `${mins}m to go`;
}

export function initials(name?: string): string {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
