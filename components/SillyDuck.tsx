"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "react-bootstrap/Image";

/**
 * Vendored rather than hotlinked from flipanim.com. Hotlinking works today, but
 * 120KB is not worth the gag breaking the day that site goes down — and this way
 * it still fires with no network, which matters for an installed PWA.
 */
const ANIMATED = "/easter-egg/silly-duck.gif";

/**
 * The first frame, for anyone who has asked the OS for less motion. A looping
 * GIF has no pause control of its own, so the alternative to this is an
 * animation they cannot stop.
 */
const STILL = "/easter-egg/silly-duck.jpg";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The media query as an external store rather than effect-driven state.
 *
 * A media query *is* external state, so this is what useSyncExternalStore is
 * for — and unlike reading it once in an effect, it keeps up if the setting is
 * changed while the overlay is still open.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    // Never actually reached: the overlay only mounts after a click. Present
    // because useSyncExternalStore requires a server snapshot.
    () => false,
  );
}

/** The screen goes blank and the duck judges you. Dismissed by any interaction. */
export default function SillyDuck({ onDismiss }: { onDismiss: () => void }) {
  const reduceMotion = usePrefersReducedMotion();
  const dismissRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // The overlay covers everything, so focus has to come with it — otherwise a
    // keyboard user is left tabbing around a page they cannot see.
    dismissRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="silly-duck"
      role="dialog"
      aria-modal="true"
      aria-labelledby="silly-duck-title"
      onClick={onDismiss}
    >
      <p id="silly-duck-title" className="silly-duck-text">
        THAT&rsquo;S NOT AN OPTION YOU SILLY DUCK
      </p>

      <Image
        src={reduceMotion ? STILL : ANIMATED}
        alt="A duck, unimpressed with your choice."
        className="silly-duck-art"
      />

      <button ref={dismissRef} type="button" className="silly-duck-dismiss">
        Fine, sorry
      </button>
    </div>
  );
}
