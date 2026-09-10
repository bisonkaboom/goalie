/**
 * Emoji are multi-code-unit and often multi-code-point — "👨‍👩‍👧‍👦".length is 11,
 * spanning 7 code points joined by zero-width joiners. `maxLength={1}` or
 * `slice(0, 1)` would cut one in half and leave a lone surrogate, so truncation
 * has to happen at grapheme boundaries.
 */

const DEFAULT_EMOJI = "⭐";

/** The first user-perceived character of `value`, or `fallback` if empty. */
export function firstGrapheme(value: string, fallback = DEFAULT_EMOJI): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  // Intl.Segmenter is the only correct way to do this. Guarded because it is
  // absent from a handful of older runtimes; Array.from at least splits on code
  // points rather than UTF-16 units, so it degrades to a mangled family emoji
  // instead of a broken surrogate.
  if (typeof Intl.Segmenter === "undefined") {
    return Array.from(trimmed)[0] ?? fallback;
  }

  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const [first] = segmenter.segment(trimmed);
  return first?.segment ?? fallback;
}

/**
 * Desktop browsers hide the emoji picker behind a shortcut most people do not
 * know, so the editor offers a few one-tap defaults alongside the text input.
 */
export const QUICK_EMOJI = [
  "⭐",
  "💪",
  "📚",
  "💧",
  "🏃",
  "🧘",
  "😴",
  "🥗",
  "🚭",
  "📱",
  "🍺",
  "💸",
] as const;
