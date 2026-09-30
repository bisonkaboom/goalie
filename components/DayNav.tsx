import Link from "next/link";
import { addDays, formatDayLabel } from "@/lib/dates";
import { dayHref } from "@/lib/viewedDay";

/**
 * Step back and forth through days, on both Home and Track.
 *
 * Plain links rather than a client component with state: the day lives in the
 * URL, so every control here is just an address, and that keeps the back
 * button, bookmarking and opening a day in a new tab all working for free.
 *
 * The heading beside it already names the day, so these carry arrows instead
 * of repeating the date — but each one's accessible name spells out the date
 * it leads to, because "previous" alone is useless to a screen reader that has
 * lost track of where it is.
 */
export default function DayNav({
  basePath,
  day,
  today,
}: {
  basePath: string;
  day: string;
  today: string;
}) {
  const isToday = day === today;
  const previous = addDays(day, -1);
  const next = addDays(day, 1);

  return (
    <div className="day-nav mb-3" role="group" aria-label="Change day">
      <Link
        href={dayHref(basePath, previous, today)}
        className="btn btn-sm btn-outline-secondary"
        aria-label={`Go to ${formatDayLabel(previous)}`}
      >
        <span aria-hidden="true">‹</span>
      </Link>

      {/* Occupies the middle whether or not the reset is showing, so the two
          arrows do not jump inwards the moment you land on today. */}
      <div className="day-nav-middle">
        {isToday ? null : (
          <Link href={basePath} className="btn btn-sm btn-primary">
            Back to today
          </Link>
        )}
      </div>

      {/* A disabled anchor is still focusable and still navigates, so tomorrow
          is a <span> wearing the button's clothes rather than a link that has
          been asked nicely not to work. */}
      {isToday ? (
        <span
          className="btn btn-sm btn-outline-secondary disabled"
          aria-disabled="true"
          // Without this the arrow is unreachable by keyboard and unexplained
          // to anyone who cannot see that it is greyed out.
          title="Today is the latest day you can log"
        >
          <span aria-hidden="true">›</span>
        </span>
      ) : (
        <Link
          href={dayHref(basePath, next, today)}
          className="btn btn-sm btn-outline-secondary"
          aria-label={`Go to ${formatDayLabel(next)}`}
        >
          <span aria-hidden="true">›</span>
        </Link>
      )}
    </div>
  );
}
