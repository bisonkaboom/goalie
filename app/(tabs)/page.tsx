import DayChart from "@/components/DayChart";
import { formatDayLabel } from "@/lib/dates";
import { getDayScore, getToday } from "@/lib/db/queries";

/**
 * Today's score. No auth guard needed — proxy.ts gates every non-public route,
 * and the tabs layout would fail first anyway.
 */
export default async function HomePage() {
  const today = await getToday();
  const score = await getDayScore(today);

  return (
    <>
      <h1 className="h4 mb-1">Today</h1>
      <p className="text-body-secondary mb-3">{formatDayLabel(today)}</p>
      <DayChart {...score} label="Today" />
    </>
  );
}
