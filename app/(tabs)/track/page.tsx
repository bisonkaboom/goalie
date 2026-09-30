import type { Metadata } from "next";
import DayNav from "@/components/DayNav";
import TallyList from "@/components/TallyList";
import { formatDayLabel } from "@/lib/dates";
import { getGoalsOnDay, getToday } from "@/lib/db/queries";
import { resolveViewedDay } from "@/lib/viewedDay";

export const metadata: Metadata = {
  title: "Track",
};

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const { day: requested } = await searchParams;
  const { day, today, isToday } = resolveViewedDay(requested, await getToday());

  // Goals are resolved against the viewed day, not today: a goal added last
  // week should not appear on a day before it existed, and one whose value
  // changed since should tally at the value it had then.
  const goals = await getGoalsOnDay(day);

  // Disabled goals score zero, and a goal with no setting on or before the
  // viewed day did not exist yet — neither belongs on a tally screen. Setup
  // wants the full list, so the filter lives here rather than in the query.
  const active = goals.filter((goal) => goal.isEnabled);

  return (
    <>
      <h1 className="h4 mb-1">
        Track
        <span className="fw-light ms-1 text-body-secondary small">
          - {formatDayLabel(day)}
        </span>
      </h1>

      {/* Louder than the heading, and only when it applies. Every button below
          writes to the day named here, so "you are not on today" has to be
          impossible to miss before the first tap, not discovered after it. */}
      {isToday ? null : (
        <p className="day-past-notice" role="status">
          Editing a past day. Tallies you add here count towards{" "}
          {formatDayLabel(day)}.
        </p>
      )}

      <DayNav basePath="/track" day={day} today={today} />

      <TallyList goals={active} day={day} />
    </>
  );
}
