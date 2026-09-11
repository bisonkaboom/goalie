import type { Emoji, EmojiMartData } from "@emoji-mart/data";

/**
 * Emoji search over the @emoji-mart/data set — 1,870 emoji with names,
 * keywords, skin tone variants and emoticons.
 *
 * The dataset is ~81 KB gzipped, which is more than belongs in the bundle for
 * every page view when only the goal editor ever needs it. So it is pulled in
 * with a dynamic import the first time a picker mounts and memoised after
 * that: nothing on Home or Track pays for it, and search stays local and
 * instant once loaded rather than round-tripping per keystroke.
 */

export type { Emoji } from "@emoji-mart/data";

export const DEFAULT_EMOJI = "⭐";

/** Search results are capped so the grid stays a glanceable single block. */
export const MAX_RESULTS = 15;

export const CATEGORY_LABELS: Record<string, string> = {
  people: "Smileys & people",
  nature: "Animals & nature",
  foods: "Food & drink",
  activity: "Activity",
  places: "Travel & places",
  objects: "Objects",
  symbols: "Symbols",
  flags: "Flags",
};

/**
 * Emoji are multi-code-unit and often multi-code-point — "👨‍👩‍👧‍👦".length is 11,
 * spanning 7 code points joined by zero-width joiners. `maxLength={1}` or
 * `slice(0, 1)` would cut one in half and leave a lone surrogate, so truncation
 * has to happen at grapheme boundaries.
 */
export function firstGrapheme(value: string, fallback = DEFAULT_EMOJI): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  // Intl.Segmenter is the only correct way to do this. Guarded because it is
  // absent from a handful of older runtimes; Array.from at least splits on code
  // points rather than UTF-16 units, so it degrades to a mangled emoji rather
  // than a broken surrogate.
  if (typeof Intl.Segmenter === "undefined") {
    return Array.from(trimmed)[0] ?? fallback;
  }

  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const [first] = segmenter.segment(trimmed);
  return first?.segment ?? fallback;
}

// Pictographic covers most emoji; Regional_Indicator catches flags (🇺🇸), and
// U+20E3 catches keycaps (1️⃣) whose first code point is an ASCII digit.
const EMOJI_PATTERN = /[\p{Extended_Pictographic}\p{Regional_Indicator}]|\u{20E3}/u;

/**
 * Whether a string actually looks like an emoji. Used server-side so a goal
 * cannot be saved with "a" as its icon — a regex rather than a dataset lookup,
 * because loading 422 KB of JSON to validate one character is not a trade worth
 * making.
 */
export function isEmojiLike(value: string): boolean {
  return EMOJI_PATTERN.test(value);
}

let cached: Promise<EmojiMartData> | null = null;

/** Loads (and memoises) the emoji dataset. Safe to call on every render. */
export function loadEmojiData(): Promise<EmojiMartData> {
  cached ??= import("@emoji-mart/data").then(
    (module) => (module.default ?? module) as unknown as EmojiMartData,
  );
  return cached;
}

/**
 * Ranked search across ids, names, keywords and emoticons.
 *
 * Every whitespace-separated token must match something, so "red heart"
 * narrows rather than widening. Ties break toward the lower Unicode version —
 * older emoji render correctly on far more devices, so a v1 match is a safer
 * suggestion than a v15 one.
 */
export function searchEmojis(
  data: EmojiMartData,
  query: string,
  limit = MAX_RESULTS,
): Emoji[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  // Aliases map retired names onto current ids ("satisfied" → "laughing").
  const aliased = data.aliases[tokens.join("_")];

  const scored: { emoji: Emoji; score: number }[] = [];

  for (const emoji of Object.values(data.emojis)) {
    let total = 0;
    let matchedAll = true;

    for (const token of tokens) {
      const score = scoreToken(emoji, token);
      if (score === null) {
        matchedAll = false;
        break;
      }
      total += score;
    }

    if (!matchedAll) continue;
    if (aliased === emoji.id) total = -1;
    scored.push({ emoji, score: total });
  }

  scored.sort(
    (a, b) =>
      a.score - b.score ||
      versionOf(a.emoji) - versionOf(b.emoji) ||
      a.emoji.name.localeCompare(b.emoji.name),
  );

  return scored.slice(0, limit).map((entry) => entry.emoji);
}

/**
 * Whether `token` appears in `haystack` at the start of a word.
 *
 * A plain `includes` drags in junk on short queries: "run" would match Brunei
 * and Burundi by name and beer by the keyword "drunk", "read" would match
 * bread and thread, "phone" would match headphones. Requiring a word start
 * trades a shorter result list for one that is actually all relevant.
 */
function matchesWordStart(haystack: string, token: string): boolean {
  let index = haystack.indexOf(token);
  while (index !== -1) {
    // Underscores in ids count as separators, so "man_running" matches "run".
    if (index === 0 || /[^a-z0-9]/.test(haystack[index - 1])) return true;
    index = haystack.indexOf(token, index + 1);
  }
  return false;
}

function scoreToken(emoji: Emoji, token: string): number | null {
  const id = emoji.id.toLowerCase();
  const name = emoji.name.toLowerCase();

  if (id === token || name === token) return 0;
  if (emoji.emoticons?.includes(token)) return 0;
  if (id.startsWith(token) || name.startsWith(token)) return 1;

  let best: number | null = null;
  for (const keyword of emoji.keywords) {
    if (keyword === token) return 2;
    if (keyword.startsWith(token)) best = Math.min(best ?? 3, 3);
  }
  if (best !== null) return best;

  if (matchesWordStart(name, token) || matchesWordStart(id, token)) return 4;
  if (emoji.keywords.some((keyword) => matchesWordStart(keyword, token))) return 5;
  return null;
}

// `version` is usually a number but the dataset carries "12.1"/"13.1" too.
function versionOf(emoji: Emoji): number {
  return Number(emoji.version) || 0;
}

/** The first `limit` emoji of a category, for the browse state. */
export function categoryEmojis(
  data: EmojiMartData,
  categoryId: string,
  limit = MAX_RESULTS,
): Emoji[] {
  const category = data.categories.find((entry) => entry.id === categoryId);
  if (!category) return [];

  return category.emojis
    .slice(0, limit)
    .map((id) => data.emojis[id])
    .filter((emoji): emoji is Emoji => Boolean(emoji));
}

/**
 * The emoji record whose default skin renders as `glyph`, if any. Lets the
 * picker show the name of an already-saved emoji and offer its skin tones.
 */
export function findByGlyph(data: EmojiMartData, glyph: string): Emoji | null {
  for (const emoji of Object.values(data.emojis)) {
    if (emoji.skins.some((skin) => skin.native === glyph)) return emoji;
  }
  return null;
}
