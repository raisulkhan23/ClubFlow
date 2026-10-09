import { ConvexError } from "convex/values";

/**
 * Extracts a clean, user-facing message from an error.
 *
 * The backend throws `ConvexError` with a human sentence (e.g. `"Mobile number"
 * must be a valid phone number.`). Surfacing `err.message` directly dumps a raw
 * envelope — `[CONVEX M(registrations:register)] [Request ID: …] Server Error
 * Uncaught …` — which is not something to show a registrant. So unwrap the
 * `ConvexError` payload first and fall back to a generic sentence.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data;
    if (typeof data === "string" && data.trim().length > 0) return data.trim();
    // Some errors carry a { message } shape instead of a bare string.
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string" &&
      (data as { message: string }).message.trim().length > 0
    ) {
      return (data as { message: string }).message.trim();
    }
    return fallback;
  }

  // Non-Convex errors (network drop, unexpected throw): avoid leaking stack.
  if (err instanceof Error && err.message && !/^\[CONVEX /.test(err.message)) {
    return fallback;
  }
  return fallback;
}
