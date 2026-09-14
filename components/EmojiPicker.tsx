"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import FormControl from "react-bootstrap/FormControl";
import FormLabel from "react-bootstrap/FormLabel";
import Spinner from "react-bootstrap/Spinner";
import type { EmojiMartData } from "@emoji-mart/data";
import {
  MAX_RESULTS,
  categoryEmojis,
  findByGlyph,
  loadEmojiData,
  searchEmojis,
  type Emoji,
} from "@/lib/emoji";
import { readRecents } from "@/lib/emojiRecents";
import { isEmojiRenderable } from "@/lib/emojiSupport";

/**
 * What the grid shows before the user has any recents. "activity" is the one
 * category whose contents read as goals — running, lifting, sport — so it works
 * as a starter set rather than as an arbitrary slice of the dataset.
 */
const SUGGESTED_CATEGORY = "activity";

/** A result carries its own glyph so a toned recent renders as 💪🏽, not 💪. */
type Choice = { emoji: Emoji; glyph: string };

/**
 * Search-driven emoji picker.
 *
 * With no query it shows recents, or a starter set the first time round, so
 * there is always something to tap; typing switches to ranked search capped at
 * 15 results. Results are filtered through a canvas render test, so emoji this
 * device has no glyph for never appear as tofu boxes.
 *
 * There is deliberately no category browser. Eight chips of "Smileys & people"
 * and "Travel & places" is a second, competing way to find an emoji, and it
 * cost a scrolling row across the top of a bottom sheet that is already tight
 * on a phone. Search plus recents covers the same ground in less space.
 *
 * Skin tones are not offered either. A goal's icon is seen at list size, where
 * the tone barely reads, and the row only appeared for the 305 of 1,870 emoji
 * that carry variants — so it was a control that came and went unpredictably
 * for a choice that does not show. A tone already saved still renders as saved:
 * the picker stores whole glyphs, so nothing existing is rewritten.
 */
export default function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [data, setData] = useState<EmojiMartData | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  // The dataset is fetched on first mount rather than imported statically, so
  // it only costs anything once the goal editor is actually opened. Recents are
  // read here too rather than in a state initialiser, because localStorage is
  // unavailable during the server render and would cause a hydration mismatch.
  useEffect(() => {
    let active = true;
    const stored = readRecents();

    void loadEmojiData().then((loaded) => {
      if (!active) return;
      setData(loaded);
      setRecents(stored);
    });

    return () => {
      active = false;
    };
  }, []);

  const results = useMemo<Choice[]>(() => {
    if (!data) return [];

    if (query.trim()) {
      // Over-fetch, then drop unrenderable glyphs, so the grid still fills up
      // on a device missing a chunk of the newer emoji.
      return searchEmojis(data, query, MAX_RESULTS * 4)
        .map((emoji) => ({ emoji, glyph: emoji.skins[0].native }))
        .filter((choice) => isEmojiRenderable(choice.glyph))
        .slice(0, MAX_RESULTS);
    }

    const recent = recents
      .map((glyph) => {
        const emoji = findByGlyph(data, glyph);
        return emoji ? { emoji, glyph } : null;
      })
      .filter((choice): choice is Choice => choice !== null)
      .filter((choice) => isEmojiRenderable(choice.glyph));

    if (recent.length > 0) return recent;

    return categoryEmojis(data, SUGGESTED_CATEGORY, MAX_RESULTS * 4)
      .map((emoji) => ({ emoji, glyph: emoji.skins[0].native }))
      .filter((choice) => isEmojiRenderable(choice.glyph))
      .slice(0, MAX_RESULTS);
  }, [data, query, recents]);

  const selected = useMemo(
    () => (data ? findByGlyph(data, value) : null),
    [data, value],
  );

  return (
    <div>
      <FormLabel htmlFor="emoji-search">Emoji</FormLabel>

      <div className="d-flex align-items-center gap-3 mb-2">
        <span
          className="fs-1 lh-1"
          role="img"
          aria-label={selected ? selected.name : "Selected emoji"}
        >
          {value}
        </span>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <FormControl
            id="emoji-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search — run, water, sleep…"
            autoComplete="off"
            disabled={!data}
          />
        </div>
      </div>

      {data === null ? (
        <div className="d-flex align-items-center gap-2 text-body-secondary py-3">
          <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
          <span>Loading emoji…</span>
        </div>
      ) : (
        <>
          {results.length === 0 ? (
            <p className="text-body-secondary small mb-0 py-2">
              {query.trim()
                ? `Nothing matches “${query.trim()}”. Try a different word.`
                : "Nothing here yet."}
            </p>
          ) : (
            <div className="d-flex flex-wrap gap-1" role="group" aria-label="Emoji results">
              {results.map((choice) => (
                <EmojiButton
                  key={choice.glyph}
                  emoji={choice.emoji}
                  glyph={choice.glyph}
                  isSelected={choice.glyph === value}
                  onSelect={onChange}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmojiButton({
  emoji,
  glyph,
  isSelected,
  onSelect,
}: {
  emoji: Emoji;
  glyph: string;
  isSelected: boolean;
  onSelect: (emoji: string) => void;
}) {
  return (
    <Button
      type="button"
      // Empty variant suppresses react-bootstrap's default btn-primary class,
      // leaving .emoji-tile to supply theme-aware colours.
      variant=""
      className={`emoji-tile border fs-4 lh-1 px-2 py-1 ${
        isSelected ? "emoji-tile-selected" : ""
      }`}
      // The dataset's real name, so screen readers and long-press tooltips get
      // "Flexed Biceps" instead of a bare glyph.
      aria-label={emoji.name}
      title={emoji.name}
      aria-pressed={isSelected}
      onClick={() => onSelect(glyph)}
    >
      {glyph}
    </Button>
  );
}
