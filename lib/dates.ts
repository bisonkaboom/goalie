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

/**
 * Whether a value is a real `YYYY-MM-DD` calendar date.
 *
 * The shape test alone is not enough: `2026-02-30` and `2026-13-01` both match
 * the pattern, and `Date` silently rolls them forward rather than rejecting
 * them, so the only reliable check is whether the date survives a round trip
 * unchanged. That also rules out a two-digit year — `Date.UTC(50, …)` means
 * 1950, which will not format back as `0050`.
 *
 * Load-bearing for `adjustTally`, which takes a day from the client.
 */
export function isCalendarDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, date] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date)).toISOString().slice(0, 10) === value;
}

/**
 * Whether a `YYYY-MM-DD` falls on the first of its month.
 *
 * String-sliced rather than parsed, for the same reason the helpers above are:
 * `new Date("2026-10-01").getDate()` is 1 only if the runtime's zone is at or
 * east of UTC, and 30 everywhere in the Americas.
 */
export function isFirstOfMonth(day: string): boolean {
  return day.slice(-2) === "01";
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

/** e.g. "Tue" — the label on a compact multi-day tile. */
export function formatWeekdayShort(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)));
}
