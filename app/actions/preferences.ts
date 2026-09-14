"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isBackgroundKind } from "@/lib/backgrounds";
import {
  BACKGROUND_COOKIE,
  PREFERENCE_MAX_AGE,
  THEME_COOKIE,
  isThemePreference,
} from "@/lib/preferences";

/**
 * As with the goal actions, every export here is a public POST endpoint, so the
 * value is re-validated regardless of what the form allowed.
 *
 * These carry no account data — they decide which stylesheet variables apply
 * and whether one decorative image loads — so they are not scoped to a user and
 * need no authorization beyond the proxy already gating the route.
 */

async function writePreference(name: string, value: string) {
  const store = await cookies();
  store.set(name, value, {
    path: "/",
    maxAge: PREFERENCE_MAX_AGE,
    // Never read from client JavaScript: the settings form is handed its current
    // values as props, and the theme is applied from the server-rendered
    // attribute.
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function setThemePreference(value: string) {
  if (!isThemePreference(value)) throw new Error("Unknown theme.");
  await writePreference(THEME_COOKIE, value);

  // "layout", because the theme is an attribute on <html> in the root layout —
  // revalidating this route's page alone would leave every other route holding
  // the old colour scheme.
  revalidatePath("/", "layout");
}

export async function setBackground(value: string) {
  if (!isBackgroundKind(value)) throw new Error("Unknown background.");
  await writePreference(BACKGROUND_COOKIE, value);
  revalidatePath("/", "layout");
}
