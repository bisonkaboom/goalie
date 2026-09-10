export type GoalDirection = "do_more" | "do_less";

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
