"use client";

import { useId } from "react";
import { Arc } from "@visx/shape";
import { Group } from "@visx/group";
import {
  clockwiseBand,
  counterClockwiseBand,
  pointOnCircle,
  symmetricBottomBand,
  type Band,
  type ShadowSegment,
} from "@/lib/dayChart";
import { formatDayLabel } from "@/lib/dates";

const TAU = Math.PI * 2;

/** Matches the source artwork, so the proportions scale from one place. */
const VIEW = 250;
const CENTRE = VIEW / 2;

const RINGS = {
  net: { radius: 115.16, width: 20 },
  positive: { radius: 93.23, width: 10 },
  negative: { radius: 75, width: 10 },
} as const;

export type DayChartProps = {
  /** Points earned from Do More goals. */
  positive: number;
  /** Points lost to Do Less goals, as a positive number. */
  negative: number;
  /** The day's point target — one full turn of every ring. */
  target: number;
  /** Rendered width and height in px. Omit to fill the container. */
  size?: number;
  /** Show the target beneath the net. Off for small tiles, where it is noise. */
  showTarget?: boolean;
  /** `YYYY-MM-DD`, used for the accessible description. */
  day?: string;
  /** Overrides the accessible description's name, e.g. "Today". */
  label?: string;
};

/**
 * The daily status gauge.
 *
 * Three concentric rings, each scaled so the daily target is one full turn:
 * lost points grow out from the bottom, earned points sweep clockwise from the
 * top, and the net — the number that matters — is the outer ring. Closing that
 * outer ring back at twelve o'clock is the goal.
 *
 * A ring that beats its target laps onto itself, and the overflow casts a
 * shadow at its leading cap so the second lap reads as sitting above the
 * first. A negative net reverses direction and switches to the warm hue, so
 * the sign survives both greyscale and colour blindness.
 */
export default function DayChart({
  positive,
  negative,
  target,
  size,
  showTarget = true,
  day,
  label,
}: DayChartProps) {
  const id = useId();
  const net = positive - negative;
  const isNegative = net < 0;

  const negativeBand = symmetricBottomBand(negative, target);
  const positiveBand = clockwiseBand(positive, target);
  const netBand = isNegative
    ? counterClockwiseBand(-net, target)
    : clockwiseBand(net, target);

  const name = label ?? (day ? formatDayLabel(day) : "Day");
  const description =
    target > 0
      ? `${name}: net ${net} of ${target} target, ${positive} earned and ${negative} lost`
      : `${name}: net ${net}, ${positive} earned and ${negative} lost, no target set`;

  const dimensions = size ? { width: size, height: size } : { width: "100%" };

  // The innermost ring leaves about 130 units of clear width. A bold digit runs
  // roughly 0.6em, so "190" or "-30" at full size collides with the rings.
  const netText = String(net);
  const netFontSize = Math.min(94.09, 210 / Math.max(netText.length, 1));

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-label={description}
      className="day-chart"
      {...dimensions}
    >
      <Group top={CENTRE} left={CENTRE}>
        <Track ring={RINGS.negative} />
        <Track ring={RINGS.positive} />
        <Track ring={RINGS.net} />

        <BandArcs
          band={negativeBand}
          ring={RINGS.negative}
          color="var(--goalie-negative)"
          gradientId={`${id}-negative`}
        />
        <BandArcs
          band={positiveBand}
          ring={RINGS.positive}
          color="var(--goalie-positive)"
          gradientId={`${id}-positive`}
        />
        <BandArcs
          band={netBand}
          ring={RINGS.net}
          // The one place colour changes meaning: warm means below zero.
          color={isNegative ? "var(--goalie-negative)" : "var(--goalie-net)"}
          gradientId={`${id}-net`}
        />

        <text
          textAnchor="middle"
          dominantBaseline="central"
          y={showTarget ? -8 : 0}
          fontSize={netFontSize}
          fontWeight={700}
          // Ink, not the ring colour: the arcs carry the hue, and this stays
          // legible in either theme.
          fill="var(--bs-body-color)"
        >
          {netText}
        </text>

        {showTarget && target > 0 ? (
          <text
            textAnchor="middle"
            dominantBaseline="central"
            y={52}
            fontSize={29.43}
            fill="var(--goalie-positive-ink)"
          >
            {target}
          </text>
        ) : null}
      </Group>
    </svg>
  );
}

type Ring = { radius: number; width: number };

/**
 * The unfilled ring. Without it a day that has not started yet renders as bare
 * numbers, with no hint that anything is meant to fill.
 */
function Track({ ring }: { ring: Ring }) {
  return (
    <Arc
      innerRadius={ring.radius - ring.width / 2}
      outerRadius={ring.radius + ring.width / 2}
      startAngle={0}
      endAngle={TAU}
      fill="var(--bs-border-color)"
      opacity={0.35}
    />
  );
}

function BandArcs({
  band,
  ring,
  color,
  gradientId,
}: {
  band: Band;
  ring: Ring;
  color: string;
  gradientId: string;
}) {
  const innerRadius = ring.radius - ring.width / 2;
  const outerRadius = ring.radius + ring.width / 2;

  return (
    <>
      {band.shadows.length > 0 ? (
        <defs>
          {band.shadows.map((shadow, index) => (
            <ShadowGradient
              key={index}
              id={`${gradientId}-${index}`}
              shadow={shadow}
              radius={ring.radius}
            />
          ))}
        </defs>
      ) : null}

      {band.fullLap ? (
        <Arc
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={0}
          endAngle={TAU}
          fill={color}
        />
      ) : null}

      {band.arc ? (
        <Arc
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          // Half the band width rounds the caps fully, matching the artwork's
          // stroke-linecap: round.
          cornerRadius={ring.width / 2}
          startAngle={band.arc.startAngle}
          endAngle={band.arc.endAngle}
          fill={color}
        />
      ) : null}

      {band.shadows.map((shadow, index) => (
        <Arc
          key={index}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={shadow.startAngle}
          endAngle={shadow.endAngle}
          fill={`url(#${gradientId}-${index})`}
          // Multiply darkens whatever is beneath, so one grey ramp works over
          // any ring colour and in either theme. The shadow only ever covers
          // the completed lap below it, never bare background.
          style={{ mixBlendMode: "multiply" }}
        />
      ))}
    </>
  );
}

/**
 * A grey ramp laid along the shadow's chord, opaque against the cap that casts
 * it and fading to white — which multiply leaves untouched — at the far end.
 */
function ShadowGradient({
  id,
  shadow,
  radius,
}: {
  id: string;
  shadow: ShadowSegment;
  radius: number;
}) {
  const darkAngle = shadow.darkAt === "start" ? shadow.startAngle : shadow.endAngle;
  const lightAngle = shadow.darkAt === "start" ? shadow.endAngle : shadow.startAngle;
  const dark = pointOnCircle(radius, darkAngle);
  const light = pointOnCircle(radius, lightAngle);

  return (
    <linearGradient
      id={id}
      // Coordinates resolve in the referencing element's space, which is the
      // centred Group — hence origin-relative points.
      gradientUnits="userSpaceOnUse"
      x1={dark.x}
      y1={dark.y}
      x2={light.x}
      y2={light.y}
    >
      <stop offset="0" stopColor="#5d5d5d" />
      <stop offset="0.45" stopColor="#b4b4b4" />
      <stop offset="1" stopColor="#ffffff" />
    </linearGradient>
  );
}
