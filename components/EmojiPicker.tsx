"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import FormControl from "react-bootstrap/FormControl";
import FormLabel from "react-bootstrap/FormLabel";
import FormText from "react-bootstrap/FormText";
import Spinner from "react-bootstrap/Spinner";
import type { EmojiMartData } from "@emoji-mart/data";
import {
  CATEGORY_LABELS,
  MAX_RESULTS,
  categoryEmojis,
  findByGlyph,
  loadEmojiData,
  searchEmojis,
  type Emoji,
} from "@/lib/emoji";
import { readRecents } from "@/lib/emojiRecents";
import { isEmojiRenderable } from "@/lib/emojiSupport";

/** Pseudo-category id for the recents row. */
const RECENT = "recent";

const FALLBACK_CATEGORY = "activity";

/** A result carries its own glyph so a toned recent renders as 💪🏽, not 💪. */
type Choice = { emoji: Emoji; glyph: string };

/**
 * Search-driven emoji picker.
 *
 * With no query it browses recents (or a category), so there is always
 * something to tap; typing switches to ranked search capped at 15 results.
 * Results are filtered through a canvas render test, so emoji this device has
 * no glyph for never appear as tofu boxes.
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
  const [category, setCategory] = useState(FALLBACK_CATEGORY);

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
      if (stored.length > 0) setCategory(RECENT);
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

    if (category === RECENT) {
      return recents
        .map((glyph) => {
          const emoji = findByGlyph(data, glyph);
          return emoji ? { emoji, glyph } : null;
        })
        .filter((choice): choice is Choice => choice !== null)
        .filter((choice) => isEmojiRenderable(choice.glyph));
    }

    return categoryEmojis(data, category, MAX_RESULTS * 4)
      .map((emoji) => ({ emoji, glyph: emoji.skins[0].native }))
      .filter((choice) => isEmojiRenderable(choice.glyph))
      .slice(0, MAX_RESULTS);
  }, [data, query, category, recents]);

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
          {query.trim() ? null : (
            <div className="d-flex gap-1 overflow-auto pb-2 mb-1">
              {recents.length > 0 ? (
                <CategoryChip
                  id={RECENT}
                  label="Recent"
                  isActive={category === RECENT}
                  onSelect={setCategory}
                />
              ) : null}
              {data.categories.map((entry) => (
                <CategoryChip
                  key={entry.id}
                  id={entry.id}
                  label={CATEGORY_LABELS[entry.id] ?? entry.id}
                  isActive={category === entry.id}
                  onSelect={setCategory}
                />
              ))}
            </div>
          )}

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

          {selected && selected.skins.length > 1 ? (
            <SkinToneRow emoji={selected} value={value} onChange={onChange} />
          ) : null}
        </>
      )}
    </div>
  );
}

function CategoryChip({
  id,
  label,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? "primary" : "outline-secondary"}
      className="flex-shrink-0"
      aria-pressed={isActive}
      onClick={() => onSelect(id)}
    >
      {label}
    </Button>
  );
}

/** Only 305 of the 1,870 emoji carry tone variants, so this stays hidden most of the time. */
function SkinToneRow({
  emoji,
  value,
  onChange,
}: {
  emoji: Emoji;
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <div className="mt-2">
      <FormText className="d-block mb-1">Skin tone</FormText>
      <div className="d-flex gap-1" role="group" aria-label="Skin tone">
        {emoji.skins.map((skin, index) => (
          <EmojiButton
            key={skin.unified}
            emoji={emoji}
            glyph={skin.native}
            isSelected={skin.native === value}
            onSelect={onChange}
            label={index === 0 ? `${emoji.name}, default` : `${emoji.name}, tone ${index}`}
          />
        ))}
      </div>
    </div>
  );
}

function EmojiButton({
  emoji,
  glyph,
  isSelected,
  onSelect,
  label,
}: {
  emoji: Emoji;
  glyph: string;
  isSelected: boolean;
  onSelect: (emoji: string) => void;
  label?: string;
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
      aria-label={label ?? emoji.name}
      title={label ?? emoji.name}
      aria-pressed={isSelected}
      onClick={() => onSelect(glyph)}
    >
      {glyph}
    </Button>
  );
}
