"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { BackgroundAnimal } from "@/lib/backgrounds";

/**
 * A different animal behind the Home page on every visit.
 *
 * The roll happens on the client rather than during render because a server
 * roll would be baked into the HTML — and two renders of the same page would
 * then disagree about which photo it is, which is a hydration mismatch.
 *
 * Every species goes through our own /api/background, which resolves the photo
 * URL and redirects. That route exists because the sources disagree: two need a
 * manifest request first, and one serves no CORS header and reports its photos
 * as http://. From here it is one URL either way.
 */
export default function AnimalBackground({
  kind,
}: {
  kind: BackgroundAnimal | "smorgasbord";
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // Nobody on a metered connection asked for a photo.
    if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return;

    // The nonce is what makes the animal *new*. The URL is otherwise identical
    // every visit, so the browser would just replay the copy it already has.
    const src = `/api/background?kind=${kind}&nonce=${Math.random().toString(36).slice(2)}`;

    // Loading into a detached image first, and only then handing the URL to CSS,
    // means the photo arrives whole instead of painting in strips behind the day
    // charts. One that never loads is a fine outcome — a dead source, or being
    // offline, just leaves the page with its plain background.
    let live = true;
    const image = new window.Image();
    image.onload = () => {
      if (live) setUrl(src);
    };
    image.src = src;

    return () => {
      live = false;
    };
  }, [kind]);

  return (
    <div
      className={`animal-bg${url ? " animal-bg-ready" : ""}`}
      aria-hidden="true"
      // A custom property rather than `background-image`, so the scrim in
      // globals.css can compose with the photo instead of being overwritten.
      style={url ? ({ "--animal-bg-image": `url("${url}")` } as CSSProperties) : undefined}
    />
  );
}
