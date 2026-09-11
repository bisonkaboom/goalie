"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getToday } from "@/lib/db/queries";
import { DEFAULT_EMOJI, firstGrapheme, isEmojiLike } from "@/lib/emoji";
import type { GoalDirection } from "@/lib/db/types";

/**
 * Every export in this file is a public POST endpoint, so nothing trusts the
 * client: each field is re-validated here regardless of what the form enforced.
 */

const MAX_NAME_LENGTH = 80;
const MAX_POINTS = 1000;

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/track");
  revalidatePath("/setup");
}

function cleanName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new Error("Give the goal a name.");
  return name.slice(0, MAX_NAME_LENGTH);
}

function cleanPoints(value: unknown): number {
  const points = Math.round(Number(value));
  if (!Number.isFinite(points)) throw new Error("Points must be a number.");
  return Math.min(MAX_POINTS, Math.max(0, points));
}

/**
 * One grapheme, and actually an emoji. Falls back to the default rather than
 * throwing: a bad icon is not worth losing the rest of the user's input over.
 */
function cleanEmoji(value: unknown): string {
  const glyph = firstGrapheme(typeof value === "string" ? value : "");
  return isEmojiLike(glyph) ? glyph : DEFAULT_EMOJI;
}

function cleanDirection(value: unknown): GoalDirection {
  if (value !== "do_more" && value !== "do_less") {
    throw new Error("Pick Do More or Do Less.");
  }
  return value;
}

/**
 * Writes today's row in `goal_settings`, merging with whatever is currently in
 * force so that changing only the point value does not clear the enabled flag
 * (or vice versa). Re-editing the same day overwrites rather than appends,
 * which is what `unique (goal_id, effective_on)` buys us.
 */
async function upsertTodaySetting(
  goalId: string,
  changes: { points?: number; isEnabled?: boolean },
) {
  const supabase = await createClient();
  const today = await getToday();

  const { data: current, error: readError } = await supabase
    .from("goal_settings")
    .select("effective_on, points, is_enabled")
    .eq("goal_id", goalId)
    .lte("effective_on", today)
    .order("effective_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readError) throw readError;

  const points = changes.points ?? current?.points ?? 0;
  const isEnabled = changes.isEnabled ?? current?.is_enabled ?? true;

  // A rename-only save would otherwise plant a redundant row for today. Skip it
  // when nothing scoring-related actually changed, so the effective-dating
  // history stays readable.
  const unchanged =
    current !== null &&
    current !== undefined &&
    current.effective_on !== today &&
    current.points === points &&
    current.is_enabled === isEnabled;
  if (unchanged) return;

  const { error } = await supabase.from("goal_settings").upsert(
    {
      goal_id: goalId,
      effective_on: today,
      points,
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "goal_id,effective_on" },
  );
  if (error) throw error;
}

/**
 * Creates or updates a goal in one round-trip.
 *
 * Identity fields (name, emoji) are not dated — a rename applies to all
 * history. Scoring fields (points, enabled) go through `upsertTodaySetting`.
 * `direction` is create-only: `day_scores` joins it live, so changing it would
 * retroactively re-sign every past tally.
 */
export async function saveGoal(input: {
  id?: string;
  name: string;
  emoji: string;
  direction: GoalDirection;
  points: number;
  isEnabled: boolean;
}) {
  const supabase = await createClient();
  const name = cleanName(input.name);
  const emoji = cleanEmoji(input.emoji);
  const points = cleanPoints(input.points);
  const isEnabled = Boolean(input.isEnabled);

  if (input.id) {
    // Note the absent `direction` — deliberately ignored on update.
    const { error } = await supabase
      .from("goals")
      .update({ name, emoji })
      .eq("id", input.id);
    if (error) throw error;

    await upsertTodaySetting(input.id, { points, isEnabled });
    revalidateAll();
    return;
  }

  const direction = cleanDirection(input.direction);
  const profile = await getProfile();
  const today = await getToday();

  const { data: last } = await supabase
    .from("goals")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      user_id: profile.id,
      name,
      emoji,
      direction,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) throw error;

  // A goal is unscorable until it has a setting, so seed one effective today.
  const { error: settingError } = await supabase.from("goal_settings").insert({
    goal_id: goal.id,
    effective_on: today,
    points,
    is_enabled: isEnabled,
  });
  if (settingError) throw settingError;

  revalidateAll();
}

/**
 * +1 / -1 on the tally screen. Delegates to a Postgres function so the
 * increment is a single statement: a read-then-write here would drop taps, and
 * the optimistic UI actively encourages rapid tapping.
 */
export async function adjustTally(goalId: string, delta: number): Promise<number> {
  const supabase = await createClient();
  const today = await getToday();

  const { data, error } = await supabase.rpc("adjust_tally", {
    p_goal_id: goalId,
    p_day: today,
    p_delta: Math.trunc(delta),
  });
  if (error) throw error;

  revalidateAll();
  return data as number;
}

export async function setDailyTarget(points: number) {
  const supabase = await createClient();
  const profile = await getProfile();
  const today = await getToday();

  const { error } = await supabase.from("daily_targets").upsert(
    {
      user_id: profile.id,
      effective_on: today,
      points: cleanPoints(points),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,effective_on" },
  );
  if (error) throw error;

  revalidateAll();
}

/**
 * Reported once from the browser so day boundaries match the user's clock.
 *
 * Validated because this is a public endpoint and an unparseable zone would
 * make every later `todayIn()` throw a RangeError, permanently bricking the
 * account. Invalid input is dropped silently rather than thrown — there is no
 * UI to surface it, and the UTC default remains serviceable.
 */
export async function setTimeZone(timeZone: string) {
  if (typeof timeZone !== "string" || timeZone.length > 64) return;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
  } catch {
    return;
  }

  const profile = await getProfile();
  // Load-bearing for the no-render-loop argument in TimeZoneSync.
  if (profile.timeZone === timeZone) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ time_zone: timeZone })
    .eq("id", profile.id);
  if (error) throw error;

  revalidateAll();
}
