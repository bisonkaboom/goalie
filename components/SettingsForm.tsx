"use client";

import { useOptimistic, useState, useTransition } from "react";
import Card from "react-bootstrap/Card";
// Subcomponents are imported from their own modules: see AppNavbar.
import CardBody from "react-bootstrap/CardBody";
import FormSelect from "react-bootstrap/FormSelect";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import SillyDuck from "@/components/SillyDuck";
import { setBackground, setThemePreference } from "@/app/actions/preferences";
import {
  BACKGROUND_KINDS,
  backgroundLabel,
  isBackgroundKind,
} from "@/lib/backgrounds";
import type { Preferences, ThemePreference } from "@/lib/preferences";

const THEMES: readonly { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

/**
 * Applies a theme to the live document.
 *
 * The server owns `data-bs-theme` on `<html>`, but waiting for the action to
 * round-trip and the layout to revalidate would leave the page in the old
 * palette for a beat after a deliberate tap. Writing the attribute here makes
 * the change instant; the cookie then makes it survive a reload.
 */
function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  // Written first: the layout's colour-mode listener reads this attribute on
  // every OS change, so updating it is what stops a later system switch from
  // reverting an explicit choice.
  root.setAttribute("data-theme-pref", preference);

  const prefersDark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.setAttribute("data-bs-theme", prefersDark ? "dark" : "light");
}

export default function SettingsForm({
  preferences,
}: {
  preferences: Preferences;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, apply] = useOptimistic(
    preferences,
    (state: Preferences, change: Partial<Preferences>) => ({
      ...state,
      ...change,
    }),
  );

  const [showDuck, setShowDuck] = useState(false);
  // Not persisted, so the gag is live again on the next visit to this screen.
  // It only ever costs one extra click, and an easter egg that fires once per
  // account and never again is one almost nobody would see.
  const [hasInsisted, setHasInsisted] = useState(false);

  function chooseTheme(theme: ThemePreference) {
    startTransition(async () => {
      apply({ theme });
      applyTheme(theme);
      await setThemePreference(theme);
    });
  }

  function chooseBackground(value: string) {
    // The <select> hands back a plain string; narrow before it reaches state, so
    // the optimistic value and the persisted one cannot disagree about the type.
    if (!isBackgroundKind(value)) return;

    // The duck protests the first time, and nothing is saved — re-rendering with
    // the unchanged optimistic value is what snaps the <select> back on its own.
    // Insisting gets you through, so the joke cannot permanently hide a real
    // setting.
    if (value === "none" && !hasInsisted) {
      setHasInsisted(true);
      setShowDuck(true);
      return;
    }

    startTransition(async () => {
      apply({ background: value });
      await setBackground(value);
    });
  }

  return (
    <>
      <Card className="mb-3">
        <CardBody>
          <h2 className="h6 mb-1">Color Theme</h2>
          <p className="small text-body-secondary mb-3">
            System follows your device, and keeps following it when your device
            switches.
          </p>

          <ToggleButtonGroup
            type="radio"
            name="theme"
            value={optimistic.theme}
            onChange={chooseTheme}
            className="w-100">
            {THEMES.map((theme) => (
              <ToggleButton
                key={theme.value}
                id={`theme-${theme.value}`}
                value={theme.value}
                variant={
                  optimistic.theme === theme.value
                    ? "primary"
                    : "outline-secondary"
                }>
                {theme.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="h6 mb-1">Background Theme</h2>
          <p className="small text-body-secondary mb-3">
            A different animal behind the Home page on every visit. Smorgasbord
            draws from all four sources, picking a new species each time. None
            removes the panel too, and stops Home fetching a photo at all.
          </p>

          <FormSelect
            value={optimistic.background}
            onChange={(event) => chooseBackground(event.currentTarget.value)}
            aria-label="Home background">
            {BACKGROUND_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {backgroundLabel(kind)}
              </option>
            ))}
          </FormSelect>
        </CardBody>
      </Card>

      {showDuck ? <SillyDuck onDismiss={() => setShowDuck(false)} /> : null}
    </>
  );
}
