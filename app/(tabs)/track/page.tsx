import type { Metadata } from "next";
import TallyList from "@/components/TallyList";
import { formatDayLabel } from "@/lib/dates";
import { getGoalsOnDay, getToday } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Track",
};

export default async function TrackPage() {
  const today = await getToday();
  const goals = await getGoalsOnDay(today);

  // Disabled goals score zero, and a goal with no setting on or before today
  // did not exist yet — neither belongs on a tally screen. Setup wants the full
  // list, so the filter lives here rather than in the query.
  const active = goals.filter((goal) => goal.isEnabled);

  return (
    <>
      <h1 className="h4 mb-1">Track</h1>
      <p className="text-body-secondary mb-3">{formatDayLabel(today)}</p>
      <TallyList goals={active} />
    </>
  );
}
