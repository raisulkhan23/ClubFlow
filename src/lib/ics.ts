/**
 * Build a downloadable .ics (RFC 5545) calendar file for one event window.
 * Times are emitted with an explicit Asia/Dhaka zone so any calendar app
 * imports them correctly regardless of local timezone.
 */
export function icsForEvent(opts: {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startAt: number;
  endAt: number;
}) {
  const toIcal = (ts: number) => {
    // +06:00 = 6h ahead of UTC; shift then print the "floating" digits of the
    // Dhaka wall-clock time (Asia/Dhaka has no DST).
    const dhaka = new Date(ts + 6 * 3_600_000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${dhaka.getUTCFullYear()}${p(dhaka.getUTCMonth() + 1)}${p(dhaka.getUTCDate())}T${p(dhaka.getUTCHours())}${p(dhaka.getUTCMinutes())}00`;
  };
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClubFlow//DRMC Tech Carnival//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@clubflow`,
    `DTSTAMP:${toIcal(Date.now())}`,
    `DTSTART;TZID=Asia/Dhaka:${toIcal(opts.startAt)}`,
    `DTEND;TZID=Asia/Dhaka:${toIcal(opts.endAt)}`,
    `SUMMARY:${esc(opts.title)}`,
    opts.description ? `DESCRIPTION:${esc(opts.description)}` : null,
    opts.location ? `LOCATION:${esc(opts.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** Trigger a browser download of the .ics file. No calendar integration is claimed. */
export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
