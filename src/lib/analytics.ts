/**
 * Pure helpers behind the analytics views.
 *
 * These live outside the page components on purpose. The original bar chart
 * computed bar heights in pixels (`style={{ height: 180 }}` per bar) inside a
 * fixed-height frame, so 30 bars overflowed a 200px container by thousands of
 * pixels. Expressing height as a percentage of the frame makes that class of
 * overflow impossible, and keeping the maths here means it can be verified
 * directly instead of by reading the component.
 */

/** Largest value in a series, never below 1 so an empty series never divides by zero. */
export function chartMax(counts: number[]): number {
  return Math.max(...counts, 1);
}

/**
 * Bar height as a percentage of its container frame.
 *
 * Always clamped into (0, 100] so a bar can never exceed — or invert — the box
 * it is drawn in. Non-finite or non-positive input degrades to the minimum stub
 * rather than producing `NaN%` / `Infinity%`.
 */
export function barHeightPercent(count: number, max: number, minimum = 2): number {
  if (!Number.isFinite(count) || !Number.isFinite(max) || max <= 0) return minimum;
  const raw = (count / max) * 100;
  if (!Number.isFinite(raw)) return minimum;
  return Math.min(100, Math.max(minimum, raw));
}

/**
 * Which event an analytics view should show.
 *
 * The selected event used to be seeded from `useState(events?.[0]?._id)`, which
 * ran once while `events` was still `undefined` — so the page stayed stuck on
 * "pick an event" for users who had events. Deriving it instead means there is
 * no effect and no setState pass, the first event is selected as soon as the
 * list arrives, and a choice that disappears (deleted event) falls back safely.
 */
export function resolveSelectedId(
  pickedId: string | null,
  availableIds: string[],
): string | null {
  if (pickedId && availableIds.includes(pickedId)) return pickedId;
  return availableIds[0] ?? null;
}
