"use client";

import { useOptimistic, useTransition } from "react";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import ListGroupItem from "react-bootstrap/ListGroupItem";
import { adjustTally } from "@/app/actions/goals";
import { directionLabel } from "@/lib/db/types";
import type { GoalOnDay } from "@/lib/db/types";

/**
 * Tap targets for the day's goals.
 *
 * Counts update optimistically because a server round-trip per tap makes rapid
 * tallying feel broken. `useOptimistic` replays every pending delta over the
 * last committed value, so a burst of taps shows the right total and — since
 * `adjustTally` increments atomically in Postgres — lands as the right total.
 *
 * Invariant: order comes from the server (Do More, then sort_order, then name)
 * and this component maps in place. Never sort by count here; rows would
 * reshuffle between taps and the user would hit the wrong goal.
 */
export default function TallyList({ goals }: { goals: GoalOnDay[] }) {
  const [, startTransition] = useTransition();
  const [optimisticGoals, applyDelta] = useOptimistic(
    goals,
    (state: GoalOnDay[], change: { goalId: string; delta: number }) =>
      state.map((goal) =>
        goal.id === change.goalId
          ? { ...goal, count: Math.max(0, goal.count + change.delta) }
          : goal,
      ),
  );

  function handleAdjust(goalId: string, delta: number) {
    startTransition(async () => {
      applyDelta({ goalId, delta });
      await adjustTally(goalId, delta);
    });
  }

  if (optimisticGoals.length === 0) {
    return (
      <p className="text-body-secondary">
        No goals yet. Add some on the Setup tab and they will show up here.
      </p>
    );
  }

  return (
    <ListGroup>
      {optimisticGoals.map((goal) => {
        const subtotal = goal.count * goal.points;
        const isDoMore = goal.direction === "do_more";

        return (
          <ListGroupItem
            key={goal.id}
            className="d-flex align-items-center gap-3 py-3"
          >
            <span className="fs-4" aria-hidden="true">
              {goal.emoji}
            </span>

            {/* minWidth:0 is required for text-truncate inside a flex child.
                Bootstrap ships no min-w-* utility, so this must be inline. */}
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-medium text-truncate">{goal.name}</div>
              <div className="small text-body-secondary">
                {goal.points} pts · {directionLabel(goal.direction)}
                {goal.count > 0 ? (
                  <>
                    {" · "}
                    <span className={isDoMore ? "text-success" : "text-danger"}>
                      {isDoMore ? "+" : "−"}
                      {subtotal}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                aria-label={`Remove one ${goal.name}`}
                disabled={goal.count === 0}
                onClick={() => handleAdjust(goal.id, -1)}
              >
                −1
              </Button>
              <span
                className="fw-bold text-center"
                style={{ minWidth: "2ch" }}
                aria-live="polite"
              >
                {goal.count}
              </span>
              <Button
                variant={isDoMore ? "success" : "outline-danger"}
                size="sm"
                aria-label={`Add one ${goal.name}`}
                onClick={() => handleAdjust(goal.id, 1)}
              >
                +1
              </Button>
            </div>
          </ListGroupItem>
        );
      })}
    </ListGroup>
  );
}
