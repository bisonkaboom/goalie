import { formatDayLabel } from "@/lib/dates";

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
  /** Renders a denser variant for multi-day grids. */
  compact?: boolean;
};

/**
 * The single scoring primitive: one day in, one rendered score out.
 *
 * Deliberately presentational and self-contained — HOME renders one, and a
 * week or month view renders many — so the visx implementation can land here
 * without touching any caller. Text-only for now.
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
  const metTarget = target > 0 && net >= target;
  const heading = label ?? (day ? formatDayLabel(day) : null);

  return (
    <div
      className={`day-chart border rounded-3 ${compact ? "p-2" : "p-3"} ${
        metTarget ? "border-success" : "border-secondary-subtle"
      }`}
      data-day={day}
    >
      {heading ? (
        <div className={`text-body-secondary ${compact ? "small" : ""} mb-1`}>{heading}</div>
      ) : null}

      <div className={compact ? "h5 mb-1" : "display-6 mb-1"}>
        {net}
        {target > 0 ? (
          <span className="text-body-secondary fs-6"> / {target}</span>
        ) : null}
      </div>

      <div className={`text-body-secondary ${compact ? "small" : ""}`}>
        <span className="text-success">+{positive}</span>
        {" · "}
        <span className="text-danger">−{negative}</span>
        {target > 0 ? (
          <>
            {" · "}
            <span className={metTarget ? "text-success" : undefined}>
              {metTarget ? "target met" : `${target - net} to go`}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
