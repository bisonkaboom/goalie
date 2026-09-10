import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { todayIn } from "@/lib/dates";
import type { DayScore, Goal, GoalOnDay, Profile } from "@/lib/db/types";

type SettingRow = { goal_id: string; points: number; is_enabled: boolean };

/**
 * The signed-in user's profile row, created on demand.
 *
 * `handle_new_user` covers accounts created after the migration ran, but any
 * account that already existed has no row, so this backfills rather than
 * failing on a foreign key later.
 *
 * Cached per request: the layout, every page and most actions need it, and
 * without this each one pays for its own round-trip. React's cache scope ends
 * with the request, so a write followed by revalidation still reads fresh.
 */
export const getProfile = cache(async function getProfile(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("getProfile called without a signed-in user");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, display_name, avatar_url, time_zone")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      timeZone: data.time_zone,
    };
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email,
      display_name: user.name,
      avatar_url: user.avatarUrl,
    })
    .select("id, email, display_name, avatar_url, time_zone")
    .single();

  if (insertError) throw insertError;

  return {
    id: created.id,
    email: created.email,
    displayName: created.display_name,
    avatarUrl: created.avatar_url,
    timeZone: created.time_zone,
  };
});

/** Today's calendar date in the user's own time zone. */
export const getToday = cache(async function getToday(): Promise<string> {
  const profile = await getProfile();
  return todayIn(profile.timeZone);
});

/** Do More before Do Less, then the user's explicit order, then name. */
function compareGoals(a: Goal, b: Goal): number {
  if (a.direction !== b.direction) return a.direction === "do_more" ? -1 : 1;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name);
}

/**
 * Every goal resolved against `day`: the point value and enabled flag that were
 * in force on that date, plus the day's tally.
 *
 * Settings are resolved in JS rather than SQL because PostgREST cannot express
 * "latest row per group", and the row count here is small (a handful of goals
 * times a handful of edits).
 */
export async function getGoalsOnDay(day: string): Promise<GoalOnDay[]> {
  const supabase = await createClient();

  const { data: goalRows, error: goalsError } = await supabase
    .from("goals")
    .select("id, name, emoji, direction, sort_order");
  if (goalsError) throw goalsError;

  const goals: Goal[] = (goalRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    direction: row.direction,
    sortOrder: row.sort_order,
  }));

  if (goals.length === 0) return [];

  const goalIds = goals.map((goal) => goal.id);

  const [{ data: settingRows, error: settingsError }, { data: tallyRows, error: talliesError }] =
    await Promise.all([
      supabase
        .from("goal_settings")
        .select("goal_id, points, is_enabled")
        .in("goal_id", goalIds)
        .lte("effective_on", day)
        // Newest first, so the first row seen per goal is the one in force.
        .order("effective_on", { ascending: false }),
      supabase.from("tallies").select("goal_id, count").eq("day", day).in("goal_id", goalIds),
    ]);

  if (settingsError) throw settingsError;
  if (talliesError) throw talliesError;

  const effective = new Map<string, SettingRow>();
  for (const row of (settingRows ?? []) as SettingRow[]) {
    if (!effective.has(row.goal_id)) effective.set(row.goal_id, row);
  }

  const counts = new Map<string, number>();
  for (const row of tallyRows ?? []) counts.set(row.goal_id, row.count);

  return goals
    .map((goal) => {
      const setting = effective.get(goal.id);
      return {
        ...goal,
        // No setting on or before `day` means the goal did not exist yet.
        points: setting?.points ?? 0,
        isEnabled: setting?.is_enabled ?? false,
        count: counts.get(goal.id) ?? 0,
      };
    })
    .sort(compareGoals);
}

/**
 * Scores for an inclusive day range, computed in Postgres so that goals whose
 * value changed partway through the span are priced correctly on each side.
 */
export async function getDayScores(startDay: string, endDay: string): Promise<DayScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("day_scores", {
    start_day: startDay,
    end_day: endDay,
  });
  if (error) throw error;

  return (data ?? []).map((row: DayScore) => ({
    day: row.day,
    positive: row.positive,
    negative: row.negative,
    target: row.target,
  }));
}

/**
 * A single day. Callers wanting the target should read `.target` from here
 * rather than querying `daily_targets` separately — one implementation of the
 * effective-dating rule means HOME and SETUP cannot disagree about it.
 */
export async function getDayScore(day: string): Promise<DayScore> {
  const [score] = await getDayScores(day, day);
  return score ?? { day, positive: 0, negative: 0, target: 0 };
}
