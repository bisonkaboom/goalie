import DayChart from "@/components/DayChart";
import { addDays, daysEndingAt, formatDayLabel, formatWeekdayShort } from "@/lib/dates";
import { getDayScores, getToday } from "@/lib/db/queries";
import { netScore, type DayScore } from "@/lib/db/types";

const WINDOW_DAYS = 7;

/**
 * Today's score, plus the trailing week.
 *
 * Both come from a single `day_scores` call: resolving the whole range in
 * Postgres is what makes each day priced against the point values that were in
 * force *that* day, so a goal revalued midweek does not distort the days
 * before it.
 */
export default async function HomePage() {
  const today = await getToday();
  const scores = await getDayScores(addDays(today, -(WINDOW_DAYS - 1)), today);

  // day_scores generates a row per day, but keying off the requested window
  // means the row of tiles is always seven wide regardless.
  const byDay = new Map(scores.map((score) => [score.day, score]));
  const week: DayScore[] = daysEndingAt(today, WINDOW_DAYS).map(
    (day) => byDay.get(day) ?? { day, positive: 0, negative: 0, target: 0 },
  );

  const todayScore = week[week.length - 1];
  const scored = week.filter((score) => score.target > 0);
  const metCount = scored.filter((score) => netScore(score) >= score.target).length;
  const weekTotal = week.reduce((total, score) => total + netScore(score), 0);

  return (
    <>
      <h1 className="h4 mb-1">Today</h1>
      <p className="text-body-secondary mb-3">{formatDayLabel(today)}</p>

      <div className="d-flex justify-content-center mb-4">
        <DayChart {...todayScore} label="Today" size={260} showTarget />
      </div>

      <h2 className="h6 mb-2">Past 7 days</h2>
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
    </>
  );
}
