import { isCalendarDay } from "@/lib/dates";

/**
 * Which day the Home and Track screens are looking at.
 *
 * Both default to today and accept `?day=YYYY-MM-DD` to move off it, so a
 * tally can be filed against the day it belongs to — going to bed after
 * midnight is a demerit against yesterday, and at 00:30 the app's "today" has
 * already rolled over.
 *
 * A query parameter rather than a path segment (`/track/2026-09-01`) because
 * the two screens share it: one parameter rides along when the tab bar
 * switches between them, where a segment would have to be rebuilt per route.
 *
 * Everything here is pure, and deliberately takes `today` as an argument
 * rather than calling `getToday()`. `TabNav` is a Client Component and needs
 * `DAY_PARAM`; importing it from a module that reached into `lib/db/queries`
 * would drag the server-only Supabase client into the browser bundle, which
 * fails the build outright.
 */

export const DAY_PARAM = "day";

export type ViewedDay = {
  /** The day being shown, always a real date and never in the future. */
  day: string;
  /** Today in the user's time zone, for comparison and for "back to today". */
  today: string;
  isToday: boolean;
};

/**
 * Resolves the `day` search parameter against today, falling back to today.
 *
 * Anything unusable — a malformed date, a repeated parameter, a day that has
 * not happened yet — quietly becomes today rather than an error page. This is
 * a URL people will hand-edit, and the failure mode for a typo should be the
 * screen they were already expecting.
 *
 * Future days are excluded rather than merely discouraged: a tally needs a
 * `goal_settings` row effective on or before its day to be worth anything, so
 * a day beyond today can only ever score zero while quietly holding a count.
 */
export function resolveViewedDay(
  raw: string | string[] | undefined,
  today: string,
): ViewedDay {
  const requested = typeof raw === "string" ? raw : undefined;

  // String comparison is a date comparison for this format, which is the whole
  // reason days are stored as `YYYY-MM-DD` rather than parsed.
  const usable = requested !== undefined && isCalendarDay(requested) && requested <= today;

  const day = usable ? requested : today;
  return { day, today, isToday: day === today };
}

/**
 * A link to `path` showing `day`.
 *
 * Today gets the bare path, so the common case has a clean URL and everyone
 * shares one canonical address for it rather than two that render the same
 * screen.
 */
export function dayHref(path: string, day: string, today: string): string {
  return day === today ? path : `${path}?${DAY_PARAM}=${day}`;
}
