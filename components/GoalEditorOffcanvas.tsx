"use client";

import { useState, useTransition, type FormEvent } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import FormControl from "react-bootstrap/FormControl";
import FormCheck from "react-bootstrap/FormCheck";
import FormGroup from "react-bootstrap/FormGroup";
import FormLabel from "react-bootstrap/FormLabel";
import FormText from "react-bootstrap/FormText";
import Offcanvas from "react-bootstrap/Offcanvas";
// Subcomponents come from their own modules — see AppNavbar for why.
import OffcanvasBody from "react-bootstrap/OffcanvasBody";
import OffcanvasHeader from "react-bootstrap/OffcanvasHeader";
import OffcanvasTitle from "react-bootstrap/OffcanvasTitle";
import Spinner from "react-bootstrap/Spinner";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import { saveGoal } from "@/app/actions/goals";
import { formatDayLabel } from "@/lib/dates";
import { directionLabel } from "@/lib/db/types";
import type { GoalDirection, GoalOnDay } from "@/lib/db/types";
import { firstGrapheme, QUICK_EMOJI } from "@/lib/emoji";

type Props = {
  show: boolean;
  /** `null` puts the sheet in create mode. */
  goal: GoalOnDay | null;
  today: string;
  onHide: () => void;
  /** Fires after the slide-out finishes, so the title does not flip mid-animation. */
  onExited: () => void;
};

/**
 * Create and edit share one sheet, sliding up from the bottom.
 *
 * The form is remounted via `key` on each open rather than syncing props into
 * state with an effect. The key sits on the form, not the Offcanvas, so the
 * slide animation is preserved.
 */
export default function GoalEditorOffcanvas({
  show,
  goal,
  today,
  onHide,
  onExited,
}: Props) {
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      onExited={onExited}
      placement="bottom"
      className="app-sheet"
      aria-labelledby="goal-editor-title"
    >
      <OffcanvasHeader closeButton>
        <OffcanvasTitle id="goal-editor-title" as="h2" className="h5">
          {goal ? "Edit goal" : "New goal"}
        </OffcanvasTitle>
      </OffcanvasHeader>
      <OffcanvasBody>
        <GoalForm key={goal?.id ?? "new"} goal={goal} today={today} onDone={onHide} />
      </OffcanvasBody>
    </Offcanvas>
  );
}

function GoalForm({
  goal,
  today,
  onDone,
}: {
  goal: GoalOnDay | null;
  today: string;
  onDone: () => void;
}) {
  const isEdit = goal !== null;

  const [emoji, setEmoji] = useState(goal?.emoji ?? "⭐");
  const [name, setName] = useState(goal?.name ?? "");
  const [direction, setDirection] = useState<GoalDirection>(goal?.direction ?? "do_more");
  const [points, setPoints] = useState(String(goal?.points ?? 10));
  const [isEnabled, setIsEnabled] = useState(goal?.isEnabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await saveGoal({
          id: goal?.id,
          name,
          emoji,
          direction,
          points: Number(points),
          isEnabled,
        });
        // Only closes on success, so a failed save keeps the user's input.
        onDone();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not save the goal.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="danger" className="py-2 small">
          {error}
        </Alert>
      ) : null}

      <FormGroup className="mb-3">
        <FormLabel htmlFor="goal-emoji">Emoji</FormLabel>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <FormControl
            id="goal-emoji"
            value={emoji}
            // Truncating on change keeps the field to one grapheme without
            // maxLength, which would split a multi-code-point emoji.
            onChange={(event) => setEmoji(firstGrapheme(event.target.value, ""))}
            onBlur={() => setEmoji((current) => firstGrapheme(current))}
            className="text-center fs-3 p-1 flex-grow-0"
            style={{ width: "4rem" }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            aria-describedby="goal-emoji-help"
          />
          <div className="d-flex flex-wrap gap-1">
            {QUICK_EMOJI.map((candidate) => (
              <Button
                key={candidate}
                type="button"
                variant="light"
                size="sm"
                className="border"
                aria-label={`Use ${candidate}`}
                onClick={() => setEmoji(candidate)}
              >
                {candidate}
              </Button>
            ))}
          </div>
        </div>
        <FormText id="goal-emoji-help">
          Tap one, or use your keyboard&apos;s emoji key.
        </FormText>
      </FormGroup>

      <FormGroup className="mb-3">
        <FormLabel htmlFor="goal-name">Name</FormLabel>
        <FormControl
          id="goal-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
          autoFocus={!isEdit}
          placeholder="Morning run"
        />
      </FormGroup>

      <FormGroup className="mb-3">
        <FormLabel>Direction</FormLabel>
        {isEdit ? (
          // Not editable: day_scores joins direction live, so flipping it would
          // re-sign every past tally.
          <div>
            <div className="fw-medium">{directionLabel(goal.direction)}</div>
            <FormText>Direction is set when a goal is created.</FormText>
          </div>
        ) : (
          <ToggleButtonGroup
            type="radio"
            name="direction"
            value={direction}
            onChange={(next: GoalDirection) => setDirection(next)}
            className="d-flex"
          >
            <ToggleButton id="direction-do-more" value="do_more" variant="outline-success">
              Do More
            </ToggleButton>
            <ToggleButton id="direction-do-less" value="do_less" variant="outline-danger">
              Do Less
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </FormGroup>

      <FormGroup className="mb-3">
        <FormLabel htmlFor="goal-points">Points</FormLabel>
        <FormControl
          id="goal-points"
          type="number"
          min={0}
          inputMode="numeric"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          required
        />
      </FormGroup>

      {isEdit ? (
        <FormGroup className="mb-3">
          <FormCheck
            type="switch"
            id="goal-active"
            label="Active"
            checked={isEnabled}
            onChange={(event) => setIsEnabled(event.target.checked)}
          />
          <FormText>
            Turning a goal off hides it from Track without touching past scores.
          </FormText>
        </FormGroup>
      ) : null}

      <FormText className="d-block mb-3">
        Point and active changes apply from {formatDayLabel(today)} onward. Earlier days
        keep the values they had.
      </FormText>

      <div className="d-grid gap-2">
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            "Save"
          )}
        </Button>
        <Button type="button" variant="outline-secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
