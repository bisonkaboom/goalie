/**
 * The Goalie mark: an orange "G" whose crossbar doubles as the goal line.
 *
 * Ported from the supplied artwork with two deliberate departures, both forced
 * by the fact that this is *inline* SVG rather than an <img>:
 *
 *   - The source drove every shape from a <style> block keyed on single-letter
 *     class names (`.f`, `.k`, `.n`...). An SVG <style> inside an HTML document
 *     is document-scoped CSS, so those rules would have applied to anything on
 *     the page sharing a name — and `.e{fill:none}` is exactly the kind of rule
 *     that silently blanks an unrelated element. They are flattened to
 *     presentation attributes here.
 *   - The gradient and clip ids were `a`-`d`, which live in the same
 *     document-wide id space. Namespaced for the same reason.
 *
 * The rendering is pixel-identical to the original in Chrome, librsvg and
 * resvg, checked by diff rather than by eye.
 */

/**
 * Shared by both shading gradients. The source had the second one inherit these
 * via `xlink:href`, which also quietly inherited `gradientTransform` and
 * `gradientUnits` — easy to drop when porting, and the bar lands in the wrong
 * place without them. Spelled out on both below instead.
 */
const SHADE_STOPS: readonly (readonly [string, string])[] = [
  ["0", "#fff"],
  [".13", "#fafafa"],
  [".26", "#eeeded"],
  [".4", "#d9d8d8"],
  [".54", "#bbbabb"],
  [".68", "#969494"],
  [".82", "#686565"],
  [".96", "#322e2f"],
  ["1", "#231f20"],
];

const shadeStops = () =>
  SHADE_STOPS.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />);

export default function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 260 260"
      role="img"
      aria-label="Goalie"
      focusable="false"
      // The two shading strokes below blend in multiply. Without an isolating
      // stacking context here they would reach past the mark and multiply
      // against the navbar and the page behind it.
      style={{ isolation: "isolate" }}
    >
      <defs>
        <clipPath id="goalie-mark-clip">
          <path d="M170.66,99.77h27.85c-3.55-8.04-8.57-15.6-15.09-22.24-28.98-29.5-76.39-29.92-105.88-.94-29.5,28.98-29.92,76.39-.94,105.88,28.98,29.5,76.39,29.92,105.88.94,7.1-6.98,12.5-15.03,16.23-23.64h-28.04c-16.57,0-30-13.43-30-30s13.43-30,30-30Z" />
        </clipPath>
        <linearGradient
          id="goalie-mark-shade"
          x1="-174.34"
          y1="-391.13"
          x2="-239.89"
          y2="-391.13"
          gradientTransform="translate(358.46 474.5) rotate(-.46)"
          gradientUnits="userSpaceOnUse"
        >
          {shadeStops()}
        </linearGradient>
        <linearGradient
          id="goalie-mark-shade-bar"
          x1="-98.38"
          y1="-345.97"
          x2="-205"
          y2="-345.97"
          gradientTransform="translate(358.46 474.5) rotate(-.46)"
          gradientUnits="userSpaceOnUse"
        >
          {shadeStops()}
        </linearGradient>
      </defs>

      {/* Blue underlay along the top of the arc, kept because it is in the
          supplied artwork — but it contributes nothing: the orange sweep drawn
          below follows the same curve at 40 wide against this one's 37.26 and
          covers it completely. Deleting it changes not one pixel, checked by
          rendering both ways and diffing. Most likely a leftover layer from the
          blue mark this replaces. Safe to drop, or to widen past 40 if it was
          meant to show. */}
      <path
        d="M108.16,24.98c26.88-5.59,55.89-.93,80.66,15.32"
        fill="none"
        stroke="#156fa5"
        strokeWidth="37.26"
        strokeLinecap="round"
        strokeMiterlimit="10"
      />

      {/* The inner ring, clipped so it stops short of the crossbar. */}
      <g opacity=".65">
        <g clipPath="url(#goalie-mark-clip)">
          <circle
            cx="130"
            cy="130"
            r="52.47"
            fill="none"
            stroke="#f15a29"
            strokeWidth="28.45"
            strokeLinecap="round"
            strokeMiterlimit="10"
          />
          <path
            d="M129.57,77.53c13.43-.11,26.9,4.91,37.23,15.07"
            fill="none"
            stroke="url(#goalie-mark-shade)"
            strokeWidth="28.45"
            strokeLinecap="round"
            strokeMiterlimit="10"
            style={{ mixBlendMode: "multiply" }}
          />
          <path
            d="M93.23,92.57c9.58-9.41,22.75-15.17,37.24-15.04"
            fill="none"
            stroke="#f15a29"
            strokeWidth="28.45"
            strokeLinecap="round"
            strokeMiterlimit="10"
          />
        </g>
      </g>

      {/* The G itself: crossbar, then the sweep anticlockwise back to the top. */}
      <path
        d="M170.66,129.77h66.63c.16,49.89-34.7,94.7-85.45,105.25-58,12.06-114.8-25.18-126.86-83.18C12.91,93.84,50.16,37.04,108.16,24.98c36.25-7.54,72.03,4.18,96.72,28.19"
        fill="none"
        stroke="#f15a29"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The shading down the crossbar. The source wrapped this in a `<g
          opacity=".5">`, which is the one thing that does not survive the trip
          out of Illustrator: in SVG and CSS, opacity below 1 on a *container*
          forces that group to render into its own isolated buffer, so the
          multiply below had nothing behind it to multiply with and simply laid
          a half-transparent grey gradient over the G — a pale lozenge with a
          visible right-hand cap, instead of the bar dissolving into the orange.
          Illustrator's transparency model allows a non-isolated group, so it
          renders the blend correctly and the exported SVG cannot say so.
          Moving the same 50% onto the leaf fixes it: a leaf has no group to
          isolate, so the multiply reaches the artwork underneath. */}
      <line
        x1="170.66"
        y1="129.77"
        x2="237.29"
        y2="129.77"
        fill="none"
        stroke="url(#goalie-mark-shade-bar)"
        strokeOpacity=".5"
        strokeWidth="40"
        strokeLinecap="round"
        strokeMiterlimit="10"
        style={{ mixBlendMode: "multiply" }}
      />
    </svg>
  );
}
