/**
 * Days are calendar dates in the user's own time zone, stored as `YYYY-MM-DD`.
 * Deriving them from a UTC server clock would roll the day over mid-evening for
 * anyone west of Greenwich, so every "today" flows through here.
 */

/** `YYYY-MM-DD` for the current moment in the given IANA time zone. */
export function todayIn(timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which is also the Postgres `date` literal form.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Shifts a `YYYY-MM-DD` string by whole days without tripping over DST. */
export function addDays(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number);
  // UTC arithmetic keeps this a pure calendar operation.
  const shifted = new Date(Date.UTC(year, month - 1, date + delta));
  return shifted.toISOString().slice(0, 10);
}

/** Inclusive list of days ending at `end`, `length` entries long. */
export function daysEndingAt(end: string, length: number): string[] {
  return Array.from({ length }, (_, i) => addDays(end, i - length + 1));
}

/** e.g. "Tue, Sep 9" — for chart axes and day headings. */
export function formatDayLabel(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)));
}
