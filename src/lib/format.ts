import { format, formatDistanceToNowStrict } from "date-fns";

export function fmtDate(ts: number | undefined): string {
  if (!ts) return "—";
  return format(new Date(ts), "MMM d, yyyy");
}

export function fmtDateTime(ts: number | undefined): string {
  if (!ts) return "—";
  return format(new Date(ts), "MMM d, yyyy · h:mm a");
}

export function fmtTime(ts: number | undefined): string {
  if (!ts) return "—";
  return format(new Date(ts), "h:mm a");
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
