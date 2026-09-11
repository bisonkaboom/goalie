/**
 * Recently used emoji, kept in localStorage.
 *
 * Recorded on a successful save rather than on tap, so browsing the picker and
 * changing your mind does not pollute the list with emoji you rejected.
 */

const STORAGE_KEY = "goalie:recent-emoji";

/** One row's worth on a phone. */
export const MAX_RECENTS = 12;

export function readRecents(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    // Private-mode Safari throws on localStorage access, and a hand-edited
    // value could be unparseable. Neither is worth breaking the picker over.
    return [];
  }
}

export function rememberEmoji(glyph: string): void {
  if (typeof window === "undefined" || !glyph) return;

  try {
    const next = [glyph, ...readRecents().filter((entry) => entry !== glyph)].slice(
      0,
      MAX_RECENTS,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — recents are a convenience, not state we
    // need, so failing silently is correct here.
  }
}
