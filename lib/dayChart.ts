/**
 * Arc geometry for the daily status gauge.
 *
 * Every value is scaled so that the daily target is one full turn. A value that
 * beats its target therefore runs past 360° and laps onto itself, which is why
 * a band is described as "a completed lap, plus the arc of the overflow" rather
 * than a single sweep — the overflow has to be drawn on top of the lap
 * beneath it, with a shadow at its leading cap so the overlap reads as depth.
 *
 * Angles follow the d3-arc convention: radians, zero at twelve o'clock,
 * increasing clockwise.
 */

const TAU = Math.PI * 2;

/** How far a cast shadow trails behind an overflowing cap. */
export const SHADOW_SWEEP = Math.PI / 4;

export type ArcSegment = { startAngle: number; endAngle: number };

/** `darkAt` is the end of the segment that sits against the cap casting it. */
export type ShadowSegment = ArcSegment & { darkAt: "start" | "end" };

export type Band = {
  /** A complete turn underneath, drawn when the value met or beat its target. */
  fullLap: boolean;
  /** The partial sweep drawn on top, if any. */
  arc: ArcSegment | null;
  shadows: ShadowSegment[];
};

const EMPTY: Band = { fullLap: false, arc: null, shadows: [] };

function split(value: number, target: number) {
  const fraction = Math.abs(value) / target;
  const laps = Math.floor(fraction);
  return { fullLap: laps >= 1, sweep: (fraction - laps) * TAU };
}

/** Grows clockwise from twelve o'clock. Used for earned points and a positive net. */
export function clockwiseBand(value: number, target: number): Band {
  if (target <= 0 || value <= 0) return EMPTY;

  const { fullLap, sweep } = split(value, target);
  if (sweep === 0) return { fullLap, arc: null, shadows: [] };

  const arc = { startAngle: 0, endAngle: sweep };
  const shadows: ShadowSegment[] = fullLap
    ? [
        {
          startAngle: sweep,
          // Clamped so a nearly-complete second lap does not shadow its own start.
          endAngle: sweep + Math.min(SHADOW_SWEEP, TAU - sweep),
          darkAt: "start",
        },
      ]
    : [];

  return { fullLap, arc, shadows };
}

/**
 * Grows counter-clockwise from twelve o'clock — the mirror of `clockwiseBand`,
 * used when the net is below zero. Direction carries the sign on its own, so
 * the encoding survives being read in greyscale.
 */
export function counterClockwiseBand(value: number, target: number): Band {
  if (target <= 0 || value <= 0) return EMPTY;

  const { fullLap, sweep } = split(value, target);
  if (sweep === 0) return { fullLap, arc: null, shadows: [] };

  const arc = { startAngle: -sweep, endAngle: 0 };
  const shadows: ShadowSegment[] = fullLap
    ? [
        {
          startAngle: -sweep - Math.min(SHADOW_SWEEP, TAU - sweep),
          endAngle: -sweep,
          darkAt: "end",
        },
      ]
    : [];

  return { fullLap, arc, shadows };
}

/**
 * Grows out from six o'clock in both directions at once. Used for lost points,
 * where a widening arc along the bottom reads as a frown rather than as
 * progress toward anything.
 */
export function symmetricBottomBand(value: number, target: number): Band {
  if (target <= 0 || value <= 0) return EMPTY;

  const { fullLap, sweep } = split(value, target);
  if (sweep === 0) return { fullLap, arc: null, shadows: [] };

  const half = sweep / 2;
  const bottom = Math.PI;
  const arc = { startAngle: bottom - half, endAngle: bottom + half };

  // Two caps, so two shadows, mirrored like the arc itself.
  const trail = Math.min(SHADOW_SWEEP, (TAU - sweep) / 2);
  const shadows: ShadowSegment[] = fullLap
    ? [
        { startAngle: bottom + half, endAngle: bottom + half + trail, darkAt: "start" },
        { startAngle: bottom - half - trail, endAngle: bottom - half, darkAt: "end" },
      ]
    : [];

  return { fullLap, arc, shadows };
}

/** Cartesian point on a circle centred at the origin, angle zero at the top. */
export function pointOnCircle(radius: number, angle: number) {
  return { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) };
}
