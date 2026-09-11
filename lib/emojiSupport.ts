/**
 * Detects emoji the current device cannot actually render, so the picker does
 * not offer tofu boxes.
 *
 * The dataset's `version` field says how new an emoji is, but not whether
 * *this* OS has a glyph for it — a five-year-old phone will show empty boxes
 * for emoji its font was never updated with. The only reliable test is to draw
 * the glyph and look at the pixels.
 *
 * Browser-only. Every entry point returns `true` when it cannot test, so a
 * missing canvas hides nothing rather than emptying the picker.
 */

const CANVAS_SIZE = 32;
const FONT = `${Math.round(CANVAS_SIZE * 0.75)}px sans-serif`;

// Unassigned code point: guaranteed to have no glyph, so whatever the platform
// draws for it is that platform's "missing character" rendering.
const MISSING_GLYPH_CONTROL = "\u{10FFFF}";

// A universally supported emoji, used as the width reference below.
const SINGLE_EMOJI_REFERENCE = "😀";

const cache = new Map<string, boolean>();

let context: CanvasRenderingContext2D | null | undefined;
let missingSignature: number | null = null;
let blankSignature: number | null = null;
let referenceWidth = 0;

function getContext(): CanvasRenderingContext2D | null {
  if (context !== undefined) return context;

  if (typeof document === "undefined") {
    context = null;
    return context;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const candidate = canvas.getContext("2d", { willReadFrequently: true });

  if (candidate) {
    candidate.textBaseline = "top";
    candidate.font = FONT;
    missingSignature = signature(candidate, MISSING_GLYPH_CONTROL);
    blankSignature = signature(candidate, "");
    referenceWidth = candidate.measureText(SINGLE_EMOJI_REFERENCE).width;
  }

  context = candidate;
  return context;
}

/** FNV-1a over the pixel buffer — cheap, and we only ever compare for equality. */
function signature(ctx: CanvasRenderingContext2D, text: string): number {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillText(text, 0, 0);
  const { data } = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i += 1) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Whether `glyph` renders as a real emoji here.
 *
 * Two failure modes are caught:
 *  - No glyph at all: the drawing matches the platform's missing-character box,
 *    or nothing is drawn.
 *  - A ZWJ sequence the font lacks: the platform falls back to drawing each
 *    component separately, so 👨‍👩‍👧‍👦 comes out roughly four emoji wide.
 *
 * Known gap: an unsupported flag renders as its two letters rather than a box,
 * which neither test catches. Accepted — flags are a poor fit for a goal icon
 * anyway, and the alternative is a per-flag allowlist.
 */
export function isEmojiRenderable(glyph: string): boolean {
  const cached = cache.get(glyph);
  if (cached !== undefined) return cached;

  const ctx = getContext();
  if (!ctx || missingSignature === null || blankSignature === null) return true;

  const own = signature(ctx, glyph);
  const drawn = own !== missingSignature && own !== blankSignature;
  const singleWidth = ctx.measureText(glyph).width <= referenceWidth * 1.5;

  const supported = drawn && singleWidth;
  cache.set(glyph, supported);
  return supported;
}
