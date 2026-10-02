"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * The first-of-the-month cows, as a takeover.
 *
 * Embedded from YouTube rather than vendored the way `SillyDuck` is, because
 * this is someone else's edit set to someone else's record — hosting a copy in
 * `public/` would be republishing both. The embed at least leaves the video on
 * its own channel, with its own view count. If Goalie is ever launched
 * properly this should become an original animation; see the note in the
 * privacy policy, which discloses the embed and has to stay true.
 *
 * `youtube-nocookie.com` is Google's privacy-enhanced player, which holds off
 * on cookies until the video actually plays.
 */

const VIDEO_ID = "HnDGQwlf8Co";

const EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/**
 * Once a month, not once a page load.
 *
 * The overlay opens by itself, so without a record of having seen it, every
 * tap of the Home tab on the 1st would blank the screen again — the gag would
 * become an obstacle by mid-morning. Keyed by the day so next month's is a
 * different entry, and so a stale key cannot suppress it forever.
 */
const SEEN_PREFIX = "goalie-first-of-month:";

/**
 * Autoplay only works muted. Every browser blocks sound-on autoplay, so asking
 * for it means the video silently does not start at all — muted autoplay plus
 * a tap to unmute is the closest thing to "it just plays" that is actually
 * reachable. `playsinline` keeps iOS from throwing it into the native
 * fullscreen player, and the `playlist` repeat of the id is what makes `loop`
 * work for a single video.
 */
function embedUrl(autoplay: boolean): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: autoplay ? "1" : "0",
    playsinline: "1",
    loop: "1",
    playlist: VIDEO_ID,
    rel: "0",
    // Lets the unmute button talk to the player without loading YouTube's own
    // API script.
    enablejsapi: "1",
  });
  return `${EMBED_ORIGIN}/embed/${VIDEO_ID}?${params}`;
}

/**
 * Nothing else writes this key, so there is no change to subscribe to — the
 * value is read once per mount and then only ever changed by this component's
 * own dismiss handler, which tracks it in React state.
 */
const NEVER_CHANGES = () => () => {};

/**
 * Whether this month's cows have already been seen, read straight out of
 * `localStorage`.
 *
 * A store rather than an effect, which is what `localStorage` actually is from
 * React's point of view. The alternative — opening the overlay from an effect —
 * is setState during mount, which the React compiler's lint rules reject, and
 * reading it in a lazy `useState` initialiser instead would have the server
 * and the client disagree and trip a hydration mismatch. `getServerSnapshot`
 * is the supported way to say "assume seen until the browser can tell us
 * otherwise", so the overlay is never in the server's HTML.
 */
function useAlreadySeen(day: string): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => {
      try {
        return localStorage.getItem(SEEN_PREFIX + day) !== null;
      } catch {
        // Private browsing can throw on access. Treated as unseen, so a
        // blocked read costs the gag nothing; it just shows again next visit.
        return false;
      }
    },
    () => true,
  );
}

export default function FirstOfTheMonth({ day }: { day: string }) {
  const reduceMotion = usePrefersReducedMotion();
  const seen = useAlreadySeen(day);
  const [dismissed, setDismissed] = useState(false);
  const [muted, setMuted] = useState(true);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);

  const open = !seen && !dismissed;

  // Memoised because the Escape handler below depends on it; left as a plain
  // function it would tear down and re-bind the listener on every render.
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(SEEN_PREFIX + day, "1");
    } catch {
      // See above — worth doing, not worth failing over. `dismissed` closes
      // the overlay either way; only remembering it across visits is lost.
    }
    setDismissed(true);
  }, [day]);

  useEffect(() => {
    if (!open) return;

    // The overlay covers everything, so focus has to come with it — otherwise
    // a keyboard user is left tabbing around a page they cannot see.
    dismissRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  /**
   * Unmutes the player in place, so the sound arrives without restarting the
   * cows from the top.
   *
   * This is YouTube's postMessage protocol rather than its IFrame API script:
   * the commands needed here are two strings, and loading a third-party
   * library to send them would cost more than it saves. `playVideo` rides
   * along because a browser that refused even the muted autoplay leaves the
   * video sitting at frame one, and this tap should start it either way.
   */
  function unmute() {
    const target = frameRef.current?.contentWindow;
    if (!target) return;

    for (const func of ["unMute", "playVideo"]) {
      target.postMessage(JSON.stringify({ event: "command", func, args: [] }), EMBED_ORIGIN);
    }
    setMuted(false);
  }

  if (!open) return null;

  // Autoplay is exactly the thing `prefers-reduced-motion` exists to prevent,
  // so for anyone who asked for less, the overlay still appears but the video
  // waits to be played.
  const autoplay = !reduceMotion;

  return (
    <div
      className="cow-takeover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cow-takeover-title"
    >
      <p id="cow-takeover-title" className="cow-takeover-text">
        WAKE UP! IT&rsquo;S THE FIRST OF THE MONTH
      </p>

      <div className="cow-takeover-frame">
        <iframe
          ref={frameRef}
          src={embedUrl(autoplay)}
          title="Dancing cows: it's the first of the month"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Only while it is actually silent. Once the sound is on, this would be
          a button that does nothing sitting next to the one that matters. */}
      {autoplay && muted ? (
        <button type="button" className="cow-takeover-sound" onClick={unmute}>
          🔊 Tap for sound
        </button>
      ) : null}

      <button
        ref={dismissRef}
        type="button"
        className="cow-takeover-dismiss"
        onClick={dismiss}
      >
        Let me at my goals
      </button>
    </div>
  );
}
