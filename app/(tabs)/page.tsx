import AnimalBackground from "@/components/AnimalBackground";
import DayChart from "@/components/DayChart";
import { addDays, daysEndingAt, formatDayLabel, formatWeekdayShort } from "@/lib/dates";
import { getDayScores, getToday } from "@/lib/db/queries";
import { netScore, type DayScore } from "@/lib/db/types";
import { readPreferences } from "@/lib/preferences";

const WINDOW_DAYS = 7;

/**
 * Today's score, plus the seven completed days before it.
 *
 * Both come from a single `day_scores` call: resolving the whole range in
 * Postgres is what makes each day priced against the point values that were in
 * force *that* day, so a goal revalued midweek does not distort the days
 * before it.
 */
export default async function HomePage() {
  const { background } = await readPreferences();
  const showPhoto = background !== "none";
  const today = await getToday();
  const yesterday = addDays(today, -1);
  // The window is the seven days *before* today, so the range reaches back one
  // extra day beyond the tiles to still cover today's own chart.
  const scores = await getDayScores(addDays(today, -WINDOW_DAYS), today);

  // day_scores generates a row per day, but keying off the requested window
  // means the row of tiles is always seven wide regardless.
  const byDay = new Map(scores.map((score) => [score.day, score]));
  const emptyDay = (day: string): DayScore => ({ day, positive: 0, negative: 0, target: 0 });
  const week: DayScore[] = daysEndingAt(yesterday, WINDOW_DAYS).map(
    (day) => byDay.get(day) ?? emptyDay(day),
  );

  const todayScore = byDay.get(today) ?? emptyDay(today);
  const scored = week.filter((score) => score.target > 0);
  const metCount = scored.filter((score) => netScore(score) >= score.target).length;
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
        <h1 className="h4 mb-1">Today</h1>
        <p className="text-body-secondary mb-3">{formatDayLabel(today)}</p>

        <div className="d-flex justify-content-center mb-4">
          <DayChart {...todayScore} label="Today" size={260} showTarget />
        </div>

        <h2 className="h6 mb-2">Previous 7 days</h2>
        <div className="day-week-row mb-2">
          {week.map((score) => (
            <div key={score.day} className="text-center">
              {/* The target is dropped at this size — seven of them is noise, and
                  the ring already shows how close the day came. */}
              <DayChart {...score} showTarget={false} />
              <div className="small text-body-secondary text-truncate mt-1">
                {formatWeekdayShort(score.day)}
              </div>
            </div>
          ))}
        </div>

        <p className="text-body-secondary small mb-0">
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
