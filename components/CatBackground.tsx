"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * cataas.com hands back a random cat per request, no key or account needed.
 *
 * `width` on its own is deliberate: it resizes and re-encodes to a ~150KB
 * JPEG, where asking for `width` *and* `height` flips the service into
 * emitting a multi-megabyte PNG for the same picture.
 */
const CAT_URL = "https://cataas.com/cat?width=1200";

/**
 * A different cat behind the home page on every visit.
 *
 * The roll happens on the client rather than during render because a server
 * roll would be baked into the HTML — and two renders of the same page would
 * then disagree about which cat it is, which is a hydration mismatch.
 */
export default function CatBackground() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // Nobody on a metered connection asked for a cat.
    if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return;

    // The nonce is what makes the cat *new*. The URL is otherwise byte-identical
    // every visit, so the browser would just replay the copy it already has.
    const src = `${CAT_URL}&nonce=${Math.random().toString(36).slice(2)}`;

    // Loading into a detached image first, and only then handing the URL to CSS,
    // means the cat arrives whole instead of painting in strips behind the day
    // charts. A cat that never loads is a fine outcome: the page keeps the plain
    // background it has always had.
    let live = true;
    const image = new window.Image();
    image.onload = () => {
      if (live) setUrl(src);
    };
    image.src = src;

    return () => {
      live = false;
    };
  }, []);

  return (
    <div
      className={`cat-bg${url ? " cat-bg-ready" : ""}`}
      aria-hidden="true"
      // A custom property rather than `background-image`, so the scrim in
      // globals.css can compose with the photo instead of being overwritten.
      style={url ? ({ "--cat-bg-image": `url("${url}")` } as CSSProperties) : undefined}
    />
  );
}
