import { cookies } from "next/headers";
import { isBackgroundKind, type BackgroundKind } from "@/lib/backgrounds";

/**
 * Display preferences, kept in cookies rather than on the `users` row.
 *
 * The theme has to be known before the first byte of HTML is painted, or the
 * page flashes the wrong colours. A cookie arrives with the request, so the
 * server can put `data-bs-theme` straight on `<html>`; a database column could
 * not be read that early without a round-trip in front of every render. The
 * trade is that these are per-device rather than per-account, which is the
 * behaviour most apps have for theme anyway.
 */

export type ThemePreference = "system" | "light" | "dark";

export const THEME_COOKIE = "goalie-theme";

/**
 * Named apart from the `goalie-cat` cookie it replaces, which held "on"/"off".
 * A fresh name means a stale value cannot be misread as a species — it simply
 * fails validation and falls back to the default.
 */
export const BACKGROUND_COOKIE = "goalie-background";

/** A year. These are set-and-forget choices, not session state. */
export const PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;

export type Preferences = {
  theme: ThemePreference;
  background: BackgroundKind;
};

/** Chosen to preserve the behaviour the app had before this screen existed. */
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  background: "cat",
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export async function readPreferences(): Promise<Preferences> {
  const store = await cookies();
  const theme = store.get(THEME_COOKIE)?.value;
  const background = store.get(BACKGROUND_COOKIE)?.value;

  return {
    theme: isThemePreference(theme) ? theme : DEFAULT_PREFERENCES.theme,
    background: isBackgroundKind(background) ? background : DEFAULT_PREFERENCES.background,
  };
}
