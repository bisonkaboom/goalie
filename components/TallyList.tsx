"use client";

import {
  useMemo,
  useOptimistic,
  useState,
  useTransition,
  type ComponentPropsWithoutRef,
} from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Button from "react-bootstrap/Button";
import Collapse from "react-bootstrap/Collapse";
import ListGroup from "react-bootstrap/ListGroup";
import ListGroupItem from "react-bootstrap/ListGroupItem";
import { adjustTally, setGoalBucket } from "@/app/actions/goals";
import {
  GOAL_BUCKETS,
  bucketLabel,
  directionLabel,
  type GoalBucket,
  type GoalDirection,
  type GoalOnDay,
} from "@/lib/db/types";

const DIRECTIONS: readonly GoalDirection[] = ["do_more", "do_less"] as const;

/** Droppable ids carry both halves of a goal's slot, and must round-trip. */
type Slot = { direction: GoalDirection; bucket: GoalBucket };

const slotId = ({ direction, bucket }: Slot) => `${direction}:${bucket}`;

function parseSlotId(id: string): Slot | null {
  const [direction, bucket] = id.split(":");
  const isDirection = direction === "do_more" || direction === "do_less";
  if (!isDirection) return null;
  if (!GOAL_BUCKETS.includes(bucket as GoalBucket)) return null;
  return { direction, bucket: bucket as GoalBucket };
}

type Action =
  | { type: "adjust"; goalId: string; delta: number }
  | { type: "move"; goalId: string; bucket: GoalBucket };

/**
 * Tap targets for the day's goals, grouped into time-of-day buckets.
 *
 * Counts update optimistically because a server round-trip per tap makes rapid
 * tallying feel broken. `useOptimistic` replays every pending action over the
 * last committed value, so a burst of taps shows the right total and — since
 * `adjustTally` increments atomically in Postgres — lands as the right total.
 * Bucket moves ride the same reducer, so a goal dragged mid-tally does not snap
 * back to its old bucket while the write is in flight.
 *
 * Invariant: order within a bucket comes from the server (sort_order, then name)
 * and this component maps in place. Never sort by count here; rows would
 * reshuffle between taps and the user would hit the wrong goal. Bucket is the
 * one exception, and only because moving a row is the user's own explicit act.
 */
export default function TallyList({ goals }: { goals: GoalOnDay[] }) {
  const [, startTransition] = useTransition();
  const [optimisticGoals, apply] = useOptimistic(
    goals,
    (state: GoalOnDay[], action: Action) =>
      state.map((goal) => {
        if (goal.id !== action.goalId) return goal;
        return action.type === "adjust"
          ? { ...goal, count: Math.max(0, goal.count + action.delta) }
          : { ...goal, bucket: action.bucket };
      }),
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Empty buckets start closed. All eight stay listed and droppable, but until
  // the user has sorted anything everything sits in "All day", and eight open
  // panels reading "Drag a goal here" is not an organised screen. Computed once
  // from the initial props on purpose: after that the user's own toggles win,
  // and a bucket must not slam shut just because its last goal was dragged out.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => {
    const filled = new Set(
      goals.map((goal) => slotId({ direction: goal.direction, bucket: goal.bucket })),
    );
    const empty = new Set<string>();
    for (const direction of DIRECTIONS) {
      for (const bucket of GOAL_BUCKETS) {
        const id = slotId({ direction, bucket });
        if (!filled.has(id)) empty.add(id);
      }
    }
    return empty;
  });

  // A drag handle plus a small distance threshold, rather than a press delay:
  // the handle sets `touch-action: none`, so the browser hands us the gesture
  // without stealing it for a scroll, and every other pixel of the row keeps
  // scrolling normally.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  // Grouped once per render: eight buckets each filtering the whole list is
  // still trivial at this size, but it keeps the JSX flat.
  const bySlot = useMemo(() => {
    const groups = new Map<string, GoalOnDay[]>();
    for (const direction of DIRECTIONS) {
      for (const bucket of GOAL_BUCKETS) {
        groups.set(slotId({ direction, bucket }), []);
      }
    }
    for (const goal of optimisticGoals) {
      groups.get(slotId({ direction: goal.direction, bucket: goal.bucket }))?.push(goal);
    }
    return groups;
  }, [optimisticGoals]);

  const dragging = draggingId
    ? (optimisticGoals.find((goal) => goal.id === draggingId) ?? null)
    : null;

  function handleAdjust(goalId: string, delta: number) {
    startTransition(async () => {
      apply({ type: "adjust", goalId, delta });
      await adjustTally(goalId, delta);
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    if (!event.over) return;

    const goalId = String(event.active.id);
    const goal = optimisticGoals.find((candidate) => candidate.id === goalId);
    const target = parseSlotId(String(event.over.id));
    if (!goal || !target) return;

    // Direction is create-only on the server — it decides which side of the
    // ledger a tally lands on — so a cross-direction drop is refused here
    // rather than silently rewriting what the goal means.
    if (target.direction !== goal.direction) return;
    if (target.bucket === goal.bucket) return;

    startTransition(async () => {
      apply({ type: "move", goalId, bucket: target.bucket });
      await setGoalBucket(goalId, target.bucket);
    });
  }

  function toggle(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className="tally-columns">
        {DIRECTIONS.map((direction) => {
          const total = optimisticGoals.filter((goal) => goal.direction === direction).length;
          if (total === 0) return null;

          return (
            <section key={direction}>
              <h2 className="h6 text-body-secondary mb-2">{directionLabel(direction)}</h2>

              {GOAL_BUCKETS.map((bucket) => {
                const id = slotId({ direction, bucket });
                return (
                  <BucketPanel
                    key={id}
                    id={id}
                    bucket={bucket}
                    goals={bySlot.get(id) ?? []}
                    isOpen={!collapsed.has(id)}
                    // Only the buckets a drag can actually land in light up.
                    isDropCandidate={dragging !== null && dragging.direction === direction}
                    onToggle={() => toggle(id)}
                    onAdjust={handleAdjust}
                  />
                );
              })}
            </section>
          );
        })}
      </div>

      {/* The dragged row is drawn here instead of in place, so lifting it out of
          a bucket does not resize the bucket underneath mid-gesture. */}
      <DragOverlay>
        {dragging ? <GoalRowBody goal={dragging} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BucketPanel({
  id,
  bucket,
  goals,
  isOpen,
  isDropCandidate,
  onToggle,
  onAdjust,
}: {
  id: string;
  bucket: GoalBucket;
  goals: GoalOnDay[];
  isOpen: boolean;
  isDropCandidate: boolean;
  onToggle: () => void;
  onAdjust: (goalId: string, delta: number) => void;
}) {
  // The droppable wraps the header as well as the body, which is what lets a
  // collapsed bucket still accept a drop — it keeps a hit area when its list
  // has no height.
  const { setNodeRef, isOver } = useDroppable({ id });
  const bodyId = `${id}-body`;

  const subtotal = goals.reduce((sum, goal) => sum + goal.count * goal.points, 0);
  const active = isOver && isDropCandidate;

  return (
    <div
      ref={setNodeRef}
      className={`bucket-panel mb-2${active ? " bucket-panel-over" : ""}${
        isDropCandidate ? " bucket-panel-candidate" : ""
      }`}
    >
      <button
        type="button"
        className="bucket-header"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={bodyId}
      >
        <span className={`bucket-caret${isOpen ? " bucket-caret-open" : ""}`} aria-hidden="true">
          ▸
        </span>
        <span className="fw-medium flex-grow-1 text-start">{bucketLabel(bucket)}</span>
        <span className="small text-body-secondary">
          {goals.length === 0 ? "empty" : `${goals.length}`}
          {subtotal > 0 ? ` · ${subtotal} pts` : ""}
        </span>
      </button>

      <Collapse in={isOpen}>
        <div id={bodyId}>
          {goals.length === 0 ? (
            <p className="bucket-empty small text-body-secondary mb-0">
              Drag a goal here.
            </p>
          ) : (
            <ListGroup variant="flush">
              {goals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} onAdjust={onAdjust} />
              ))}
            </ListGroup>
          )}
        </div>
      </Collapse>
    </div>
  );
}

function GoalRow({
  goal,
  onAdjust,
}: {
  goal: GoalOnDay;
  onAdjust: (goalId: string, delta: number) => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: goal.id });

  return (
    <ListGroupItem ref={setNodeRef} className={isDragging ? "opacity-25" : undefined}>
      <GoalRowBody
        goal={goal}
        onAdjust={onAdjust}
        // dnd-kit types `listeners` as an open Record of handlers, which does
        // not narrow to button props on its own.
        handleProps={{ ...listeners, ...attributes } as ComponentPropsWithoutRef<"button">}
      />
    </ListGroupItem>
  );
}

/**
 * The row's visuals, split out so `DragOverlay` can render an identical copy
 * without a second set of draggable hooks pointing at the same id.
 */
function GoalRowBody({
  goal,
  onAdjust,
  handleProps,
  isOverlay = false,
}: {
  goal: GoalOnDay;
  onAdjust?: (goalId: string, delta: number) => void;
  handleProps?: ComponentPropsWithoutRef<"button">;
  isOverlay?: boolean;
}) {
  const subtotal = goal.count * goal.points;
  const isDoMore = goal.direction === "do_more";

  return (
    <div
      className={`d-flex align-items-center gap-2 gap-sm-3${
        isOverlay ? " tally-row-overlay" : ""
      }`}
    >
      <button
        type="button"
        className="tally-grip"
        aria-label={`Move ${goal.name} to another time of day`}
        {...handleProps}
      >
        <span aria-hidden="true">⠿</span>
      </button>

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
          disabled={goal.count === 0 || !onAdjust}
          onClick={() => onAdjust?.(goal.id, -1)}
        >
          −1
        </Button>
        <span className="fw-bold text-center" style={{ minWidth: "2ch" }} aria-live="polite">
          {goal.count}
        </span>
        <Button
          variant={isDoMore ? "success" : "outline-danger"}
          size="sm"
          aria-label={`Add one ${goal.name}`}
          disabled={!onAdjust}
          onClick={() => onAdjust?.(goal.id, 1)}
        >
          +1
        </Button>
      </div>
    </div>
  );
}
