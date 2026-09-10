"use client";

import { useEffect, useRef } from "react";
import { setTimeZone } from "@/app/actions/goals";

/**
 * Reports the browser's IANA time zone once, so `getToday()` buckets days on
 * the user's clock instead of UTC. Without it a US user's day rolls over
 * mid-afternoon, which would silently split a day's tallies across two dates.
 *
 * No render loop, for three independent reasons — any one is sufficient:
 *  1. `current` comes from the database, so once the write revalidates it
 *     matches `tz` and the effect returns immediately.
 *  2. `sent` covers the in-flight window before that revalidation lands.
 *  3. `setTimeZone` itself returns before revalidating when the stored value
 *     already matches, so a redundant call cannot trigger a re-render.
 */
export default function TimeZoneSync({ current }: { current: string }) {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || tz === current || sent.current === tz) return;
    sent.current = tz;
    void setTimeZone(tz);
  }, [current]);

  return null;
}
