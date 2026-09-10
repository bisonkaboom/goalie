"use client";

import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
// Subcomponents come from their own modules — see AppNavbar for why.
import ListGroupItem from "react-bootstrap/ListGroupItem";
import GoalEditorOffcanvas from "@/components/GoalEditorOffcanvas";
import { directionLabel } from "@/lib/db/types";
import type { GoalOnDay } from "@/lib/db/types";

/**
 * The goal list, and the only owner of the editor sheet's open/closed state.
 *
 * There is no delete: `on delete cascade` on goal_settings and tallies means
 * removing a goal would silently rewrite every past day's score. The Active
 * switch in the editor is the soft-delete instead.
 */
export default function GoalSetupList({
  goals,
  today,
}: {
  goals: GoalOnDay[];
  today: string;
}) {
  const [editing, setEditing] = useState<GoalOnDay | null>(null);
  const [show, setShow] = useState(false);

  function openCreate() {
    setEditing(null);
    setShow(true);
  }

  function openEdit(goal: GoalOnDay) {
    setEditing(goal);
    setShow(true);
  }

  // Already sorted server-side (Do More, then sort_order, then name), so
  // partitioning preserves that order within each group.
  const doMore = goals.filter((goal) => goal.direction === "do_more");
  const doLess = goals.filter((goal) => goal.direction === "do_less");

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="h6 mb-0">Goals</h2>
        <Button size="sm" onClick={openCreate}>
          Add goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <p className="text-body-secondary">No goals yet. Add one to start tracking.</p>
      ) : (
        <>
          <GoalGroup title="Do More" goals={doMore} onEdit={openEdit} />
          <GoalGroup title="Do Less" goals={doLess} onEdit={openEdit} />
        </>
      )}

      <GoalEditorOffcanvas
        show={show}
        goal={editing}
        today={today}
        onHide={() => setShow(false)}
        // Cleared only after the slide-out, so the title does not flip to
        // "New goal" while the sheet is still visible.
        onExited={() => setEditing(null)}
      />
    </>
  );
}

function GoalGroup({
  title,
  goals,
  onEdit,
}: {
  title: string;
  goals: GoalOnDay[];
  onEdit: (goal: GoalOnDay) => void;
}) {
  if (goals.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="h6 text-body-secondary">{title}</h3>
      <ListGroup>
        {goals.map((goal) => (
          <ListGroupItem
            key={goal.id}
            action
            as="button"
            type="button"
            onClick={() => onEdit(goal)}
            className={`d-flex align-items-center gap-3 text-start ${
              goal.isEnabled ? "" : "opacity-75"
            }`}
          >
            <span className="fs-4" aria-hidden="true">
              {goal.emoji}
            </span>

            {/* minWidth:0 is required for text-truncate inside a flex child;
                Bootstrap ships no min-w-* utility. */}
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-medium text-truncate">{goal.name}</div>
              <div className="small text-body-secondary">
                {goal.points} pts · {directionLabel(goal.direction)}
              </div>
            </div>

            {goal.isEnabled ? null : (
              <Badge bg="secondary-subtle" text="secondary-emphasis">
                Disabled
              </Badge>
            )}
          </ListGroupItem>
        ))}
      </ListGroup>
    </div>
  );
}
