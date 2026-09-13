import { formatDayLabel, formatWeekdayShort } from "@/lib/dates";

export type DayChartProps = {
  /** Points earned from Do More goals. */
  positive: number;
  /** Points lost to Do Less goals, as a positive number. */
  negative: number;
  /** The day's point target. */
  target: number;
  /** `YYYY-MM-DD`; when present it is used as the heading. */
  day?: string;
  /** Overrides the heading, e.g. "Today". */
  label?: string;
  /** Renders a dense tile for multi-day rows. */
  compact?: boolean;
};

/**
 * The single scoring primitive: one day in, one rendered score out.
 *
 * Deliberately presentational and self-contained — Home renders one as its hero
 * figure and seven as a compact row — so the visx implementation can land here
 * without touching any caller. Text-only for now.
 *
 * Two rules from the project's dataviz guidance shape this:
 *  - Target state is never signalled by colour alone. The check glyph and a
 *    label carry it, with colour only reinforcing; red/green alone would be
 *    unreadable for the most common form of colour blindness.
 *  - Numbers wear ink tokens rather than status colours. The explicit + and −
 *    signs carry polarity, so the values stay legible in any theme.
 */
export default function DayChart({
  positive,
  negative,
  target,
  day,
  label,
  compact = false,
}: DayChartProps) {
  const net = positive - negative;
  const hasTarget = target > 0;
  const metTarget = hasTarget && net >= target;

  const heading = label ?? (day ? formatDayLabel(day) : null);
  const summary = buildSummary({ day, label, net, positive, negative, target });

  if (compact) {
    return (
      <div
        // Padding comes from .day-chart-compact rather than a utility class so
        // it can tighten on a narrow phone.
        className={`day-chart day-chart-compact border rounded-3 text-center ${
          metTarget ? "border-success" : "border-secondary-subtle"
        }`}
        data-day={day}
        title={summary}
      >
        <div className="small text-body-secondary text-truncate">
          {label ?? (day ? formatWeekdayShort(day) : "—")}
        </div>
        {/* fs-6 rather than fs-5: at a seventh of a phone's width a three-digit
            negative score has to fit. */}
        <div className="fs-6 fw-semibold lh-1 my-1">{net}</div>
        <div
          className={`small lh-1 ${metTarget ? "text-success" : "text-body-tertiary"}`}
          aria-hidden="true"
        >
          {metTarget ? "✓" : "·"}
        </div>
        {/* The tile is glanceable; the full breakdown stays available to screen
            readers and as a hover tooltip rather than crowding the number. */}
        <span className="visually-hidden">{summary}</span>
      </div>
    );
  }

  return (
    <div
      className={`day-chart border rounded-3 p-3 ${
        metTarget ? "border-success" : "border-secondary-subtle"
      }`}
      data-day={day}
    >
      {heading ? <div className="text-body-secondary mb-1">{heading}</div> : null}

      {/* Hero figure — the one number the screen leads with. */}
      <div className="display-5 fw-semibold lh-1 mb-2">
        {net}
        {hasTarget ? (
          <span className="fs-5 fw-normal text-body-secondary"> / {target}</span>
        ) : null}
      </div>

      <div className="text-body-secondary">
        +{positive} earned · −{negative} lost
      </div>

      {hasTarget ? (
        <div className={metTarget ? "text-success" : "text-body-secondary"}>
          {metTarget ? "✓ Target met" : `${target - net} to go`}
        </div>
      ) : (
        <div className="text-body-secondary">No target set</div>
      )}
    </div>
  );
}

function buildSummary({
  day,
  label,
  net,
  positive,
  negative,
  target,
}: {
  day?: string;
  label?: string;
  net: number;
  positive: number;
  negative: number;
  target: number;
}): string {
  const name = label ?? (day ? formatDayLabel(day) : "Day");
  const score = `net ${net} (+${positive} earned, −${negative} lost)`;

  if (target <= 0) return `${name}: ${score}, no target set`;
  return net >= target
    ? `${name}: ${score}, target of ${target} met`
    : `${name}: ${score}, ${target - net} short of ${target}`;
}
