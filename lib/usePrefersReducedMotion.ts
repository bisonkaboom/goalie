"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Whether the user has asked the OS for less motion.
 *
 * A media query *is* external state, so this is what useSyncExternalStore is
 * for — and unlike reading it once in an effect, it keeps up if the setting is
 * changed while whatever it governs is still on screen.
 *
 * Shared by both easter eggs: the duck swaps its GIF for a still frame, and
 * the first-of-the-month cows hold off on autoplaying. Neither has a pause
 * control of its own, so for anyone with the setting on, the alternative is an
 * animation they cannot stop.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    // The server has no media queries. Both callers mount their overlay only
    // after an effect or a click, so this snapshot is never the one rendered.
    () => false,
  );
}
