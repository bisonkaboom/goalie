"use client";

import { useState, useTransition } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
// Subcomponents come from their own modules — see AppNavbar for why.
import CardBody from "react-bootstrap/CardBody";
import CardTitle from "react-bootstrap/CardTitle";
import FormControl from "react-bootstrap/FormControl";
import FormText from "react-bootstrap/FormText";
import InputGroup from "react-bootstrap/InputGroup";
import InputGroupText from "react-bootstrap/InputGroupText";
import Spinner from "react-bootstrap/Spinner";
import { setDailyTarget } from "@/app/actions/goals";
import { formatDayLabel } from "@/lib/dates";

/**
 * The daily points target, effective-dated exactly like goal values: saving
 * applies from today forward and leaves earlier days scored against whatever
 * target they had.
 */
export default function DailyTargetCard({
  target,
  today,
}: {
  target: number;
  today: string;
}) {
  const [value, setValue] = useState(String(target));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Resync when the server sends a new target after revalidation. Done during
  // render rather than in an effect (React's documented pattern) so there is no
  // frame where the field shows a stale value.
  const [lastTarget, setLastTarget] = useState(target);
  if (target !== lastTarget) {
    setLastTarget(target);
    setValue(String(target));
  }

  const dirty = value !== String(target);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await setDailyTarget(Number(value));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not save the target.");
      }
    });
  }

  return (
    <Card className="bg-body-tertiary border-0 mb-4">
      <CardBody>
        <CardTitle as="h2" className="h6">
          Daily target
        </CardTitle>

        {error ? (
          <Alert variant="danger" className="py-2 small">
            {error}
          </Alert>
        ) : null}

        <InputGroup>
          <FormControl
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="Daily points target"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <InputGroupText>pts</InputGroupText>
          <Button variant="primary" onClick={handleSave} disabled={pending || !dirty}>
            {pending ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              "Save"
            )}
          </Button>
        </InputGroup>

        <FormText>
          Applies from {formatDayLabel(today)}. Earlier days keep their old target.
        </FormText>
      </CardBody>
    </Card>
  );
}
