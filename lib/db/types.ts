export type GoalDirection = "do_more" | "do_less";

export type GoalBucket = "morning" | "afternoon" | "evening" | "all_day";

/**
 * Display order for the tally screen's buckets. Chronological, with "All day"
 * last because it is the catch-all rather than a fourth slot in the day — and
 * because it is the default, so an unsorted goal lands at the bottom instead of
 * in the middle of the morning.
 */
export const GOAL_BUCKETS: readonly GoalBucket[] = [
  "morning",
  "afternoon",
  "evening",
  "all_day",
] as const;

export type Profile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  timeZone: string;
};

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  direction: GoalDirection;
  bucket: GoalBucket;
  sortOrder: number;
};

/** A goal resolved against a specific day: its value and state on that date. */
export type GoalOnDay = Goal & {
  points: number;
  isEnabled: boolean;
  /** Tally count for the day. */
  count: number;
};

export type DayScore = {
  day: string;
  positive: number;
  negative: number;
  target: number;
};

/** Net score is what the user is chasing against their target. */
export function netScore(score: Pick<DayScore, "positive" | "negative">): number {
  return score.positive - score.negative;
}

/**
 * The user-facing wording, defined once so "Do More" / "Do Less" cannot drift
 * into "Good"/"Bad" or "Positive"/"Negative" in some corner of the UI.
 */
export function directionLabel(direction: GoalDirection): string {
  return direction === "do_more" ? "Do More" : "Do Less";
}

/** Defined alongside directionLabel, and for the same reason. */
export function bucketLabel(bucket: GoalBucket): string {
  switch (bucket) {
    case "morning":
      return "Morning";
    case "afternoon":
      return "Afternoon";
    case "evening":
      return "Evening";
    case "all_day":
      return "All day";
  }
}

/** Narrows an untrusted string, for the server action and nothing else. */
export function isGoalBucket(value: unknown): value is GoalBucket {
  return GOAL_BUCKETS.includes(value as GoalBucket);
}
