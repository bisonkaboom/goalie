"use client";

import { useOptimistic, useTransition } from "react";
import Card from "react-bootstrap/Card";
// Subcomponents are imported from their own modules: see AppNavbar.
import CardBody from "react-bootstrap/CardBody";
import FormCheck from "react-bootstrap/FormCheck";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import { setCatBackground, setThemePreference } from "@/app/actions/preferences";
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
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.setAttribute("data-bs-theme", prefersDark ? "dark" : "light");
}

export default function SettingsForm({ preferences }: { preferences: Preferences }) {
  const [, startTransition] = useTransition();
  const [optimistic, apply] = useOptimistic(
    preferences,
    (state: Preferences, change: Partial<Preferences>) => ({ ...state, ...change }),
  );

  function chooseTheme(theme: ThemePreference) {
    startTransition(async () => {
      apply({ theme });
      applyTheme(theme);
      await setThemePreference(theme);
    });
  }

  function toggleCat(catBackground: boolean) {
    startTransition(async () => {
      apply({ catBackground });
      await setCatBackground(catBackground);
    });
  }

  return (
    <>
      <Card className="mb-3">
        <CardBody>
          <h2 className="h6 mb-1">Colour theme</h2>
          <p className="small text-body-secondary mb-3">
            System follows your device, and keeps following it when your device switches.
          </p>

          <ToggleButtonGroup
            type="radio"
            name="theme"
            value={optimistic.theme}
            onChange={chooseTheme}
            className="w-100"
          >
            {THEMES.map((theme) => (
              <ToggleButton
                key={theme.value}
                id={`theme-${theme.value}`}
                value={theme.value}
                variant={optimistic.theme === theme.value ? "primary" : "outline-secondary"}
              >
                {theme.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="h6 mb-1">Cat background</h2>
          <p className="small text-body-secondary mb-3">
            A different cat behind the Home page on every visit. Turning this off also removes
            the panel it sits behind, and stops Home fetching the photo at all.
          </p>

          <FormCheck
            type="switch"
            id="cat-background"
            label={optimistic.catBackground ? "On" : "Off"}
            checked={optimistic.catBackground}
            onChange={(event) => toggleCat(event.currentTarget.checked)}
          />
        </CardBody>
      </Card>
    </>
  );
}
