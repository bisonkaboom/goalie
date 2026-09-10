import type { Metadata } from "next";
import DailyTargetCard from "@/components/DailyTargetCard";
import GoalSetupList from "@/components/GoalSetupList";
import { getDayScore, getGoalsOnDay, getToday } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Setup",
};

export default async function SetupPage() {
  const today = await getToday();

  // The target comes off day_scores rather than its own query, so this card and
  // the Home chart resolve the effective-dating rule identically.
  const [{ target }, goals] = await Promise.all([
    getDayScore(today),
    getGoalsOnDay(today),
  ]);

  return (
    <>
      <h1 className="h4 mb-3">Setup</h1>
      <DailyTargetCard target={target} today={today} />
      <GoalSetupList goals={goals} today={today} />
    </>
  );
}
