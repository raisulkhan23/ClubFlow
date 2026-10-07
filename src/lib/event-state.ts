export const DAY = 86_400_000;

/** Cover gradient presets (index referenced by events.coverTheme). */
export const COVER_THEMES = [
  { name: "Lime Pulse", from: "#3f6212", to: "#0c1210", accent: "#a3e635" },
  { name: "Emerald Depth", from: "#064e3b", to: "#0c1210", accent: "#34d399" },
  { name: "Cyan Circuit", from: "#155e75", to: "#0c1210", accent: "#22d3ee" },
  { name: "Violet Spark", from: "#4c1d95", to: "#0c1210", accent: "#c4b5fd" },
  { name: "Amber Ember", from: "#78350f", to: "#0c1210", accent: "#fbbf24" },
  { name: "Slate Signal", from: "#1e293b", to: "#0c1210", accent: "#94a3b8" },
] as const;

export type EventRegistrationState =
  | "open"
  | "almost_full"
  | "full"
  | "closed"
  | "live"
  | "completed"
  | "unlisted";

/**
 * Derives the public registration state of an event from real data.
 * `confirmedCount` must be the number of currently confirmed registrations.
 */
export function registrationState(
  event: {
    status: string;
    capacity: number;
    registrationDeadline: number;
  },
  confirmedCount: number,
  now: number = Date.now(),
): EventRegistrationState {
  if (event.status === "completed") return "completed";
  if (event.status === "live") return "live";
  if (event.status === "draft" || event.status === "archived") return "unlisted";
  if (event.status === "registration_closed") return "closed";
  // status === "published"
  if (now > event.registrationDeadline) return "closed";
  if (confirmedCount >= event.capacity) return "full";
  if (confirmedCount >= event.capacity * 0.85) return "almost_full";
  return "open";
}

export function canRegister(event: { status: string; capacity: number; registrationDeadline: number }, confirmedCount: number, now: number = Date.now()): boolean {
  const state = registrationState(event, confirmedCount, now);
  return state === "open" || state === "almost_full";
}

export const EVENT_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Registration Open",
  registration_closed: "Registration Closed",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
};
