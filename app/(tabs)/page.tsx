import Link from "next/link";
import AnimalBackground from "@/components/AnimalBackground";
import DayChart from "@/components/DayChart";
import DayNav from "@/components/DayNav";
import FirstOfTheMonth from "@/components/FirstOfTheMonth";
import {
  addDays,
  daysEndingAt,
  formatDayLabel,
  formatWeekdayShort,
  isFirstOfMonth,
} from "@/lib/dates";
import { getDayScores, getToday } from "@/lib/db/queries";
import { netScore, type DayScore } from "@/lib/db/types";
import { readPreferences } from "@/lib/preferences";
import { dayHref, resolveViewedDay } from "@/lib/viewedDay";

const WINDOW_DAYS = 7;

/**
 * Today's score, plus the seven completed days before it.
 *
 * Both come from a single `day_scores` call: resolving the whole range in
 * Postgres is what makes each day priced against the point values that were in
 * force *that* day, so a goal revalued midweek does not distort the days
 * before it.
 */
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { background } = await readPreferences();
  const showPhoto = background !== "none";
  const { day: requested } = await searchParams;
  const { day, today, isToday } = resolveViewedDay(requested, await getToday());
  const previousDay = addDays(day, -1);
  // The window is the seven days *before* the viewed day, so the range reaches
  // back one extra day beyond the tiles to still cover that day's own chart.
  // Stepping to a past day carries the strip with it, so the week below is
  // always the week leading up to whatever is on screen.
  const scores = await getDayScores(addDays(day, -WINDOW_DAYS), day);

  // day_scores generates a row per day, but keying off the requested window
  // means the row of tiles is always seven wide regardless.
  const byDay = new Map(scores.map((score) => [score.day, score]));
  const emptyDay = (day: string): DayScore => ({
    day,
    positive: 0,
    negative: 0,
    target: 0,
  });
  const week: DayScore[] = daysEndingAt(previousDay, WINDOW_DAYS).map(
    (entry) => byDay.get(entry) ?? emptyDay(entry),
  );

  const dayScore = byDay.get(day) ?? emptyDay(day);
  const scored = week.filter((score) => score.target > 0);
  const metCount = scored.filter(
    (score) => netScore(score) >= score.target,
  ).length;
  const weekTotal = week.reduce((total, score) => total + netScore(score), 0);

  return (
    <>
      {/* Decorative, and scoped to this page: the other tabs are for editing
          goals and tallying them, where a photo behind the form is just noise.
          Set to None in Settings, this renders nothing and never fetches. */}
      {showPhoto ? <AnimalBackground kind={background} /> : null}

      {/* The frosted slab only earns its border and shadow when there is a photo
          behind it, so with None the Home page is plain content again. */}
      <div className={`app-reading${showPhoto ? " animal-panel" : ""}`}>
        {/* The heading is the day itself, so a past day announces itself in
            the first line rather than in a note underneath. */}
        <h1 className="h4 mb-1">{isToday ? "Today" : formatDayLabel(day)}</h1>
        <p className="text-body-secondary mb-3">
          {isToday ? formatDayLabel(today) : "Viewing a past day"}
        </p>

        <DayNav basePath="/" day={day} today={today} />

        {/* Keyed off `today`, not the viewed day: this blanks the screen and
            starts playing, so browsing back to a past 1st must not trigger it.
            `today` is already the user's own calendar day, so the cows arrive
            at their midnight rather than at UTC's. */}
        {isToday && isFirstOfMonth(today) ? <FirstOfTheMonth day={today} /> : null}

        <div className="d-flex justify-content-center mb-4">
          <DayChart
            {...dayScore}
            label={isToday ? "Today" : undefined}
            day={day}
            size={260}
            showTarget
          />
        </div>

        <h2 className="h6 mb-2">Previous 7 days</h2>
        <div className="day-week-row mb-2">
          {week.map((score) => (
            // The whole tile is the link, gauge and weekday together: at this
            // size the ring is a much easier target than the three letters
            // under it, and on a phone it is the only one worth aiming at.
            <Link
              key={score.day}
              href={dayHref("/", score.day, today)}
              className="day-week-tile text-center"
            >
              {/* The target is dropped at this size — seven of them is noise, and
                  the ring already shows how close the day came.
                  `day` gives the gauge a real accessible name, which is what
                  the link now announces itself with. */}
              <DayChart {...score} day={score.day} showTarget={false} />
              <div className="small text-body-secondary text-truncate mt-1">
                {formatWeekdayShort(score.day)}
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-secondary small mb-0 fst-italic">
          {scored.length > 0
            ? `Target met on ${metCount} of ${scored.length} ${
                scored.length === 1 ? "day" : "days"
              } · ${weekTotal} pts total`
            : `${weekTotal} pts total · set a daily target on Setup to track streaks`}
        </p>
      </div>
    </>
  );
}
