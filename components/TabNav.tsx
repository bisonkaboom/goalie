"use client";

import Link from "next/link";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import Nav from "react-bootstrap/Nav";
// Subpath imports: see AppNavbar. Applied here too, even though this module is
// client-side and dot notation would work, so the rule has no exceptions.
import NavLink from "react-bootstrap/NavLink";
import { DAY_PARAM } from "@/lib/viewedDay";

/**
 * `null` is the index segment, so it doubles as Home's identity.
 *
 * `keepsDay` is what makes "see the day, then fix the day" one gesture: Home
 * and Track both render a particular date, so switching between them should
 * stay on it. Setup has no notion of a day — carrying the parameter there
 * would be a dead query string that then rode back out on the next tab.
 */
const TABS = [
  { segment: null, href: "/", label: "Home", keepsDay: true },
  { segment: "track", href: "/track", label: "Track", keepsDay: true },
  { segment: "setup", href: "/setup", label: "Setup", keepsDay: false },
] as const;

/**
 * The only client-side piece of the header, split out so AppNavbar can stay a
 * Server Component and keep awaiting the user for the avatar.
 */
export default function TabNav() {
  // Reads the active child of the (tabs) layout: null | "track" | "setup".
  // Cheaper than usePathname and immune to trailing slashes.
  const segment = useSelectedLayoutSegment();

  // Read here rather than passed down from the layout: a layout never receives
  // searchParams, because it is not re-rendered when only the query changes.
  // The pages are all dynamically rendered already, so this costs no
  // prerendering that was happening anyway.
  const day = useSearchParams().get(DAY_PARAM);

  return (
    <Nav
      as="nav"
      variant="underline"
      aria-label="Sections"
      className="justify-content-around flex-nowrap"
    >
      {TABS.map((tab) => {
        const isActive = tab.segment === segment;
        // No validation here: the page resolving the parameter falls back to
        // today for anything unusable, so a hand-edited URL cannot be carried
        // into a broken state by the tab bar.
        const href = day && tab.keepsDay ? `${tab.href}?${DAY_PARAM}=${day}` : tab.href;
        return (
          <NavLink
            key={tab.href}
            // Without `as={Link}` this renders a plain anchor and every tab
            // switch becomes a full document load.
            as={Link}
            href={href}
            active={isActive}
            aria-current={isActive ? "page" : undefined}
            className="px-3 py-2"
          >
            {tab.label}
          </NavLink>
        );
      })}
    </Nav>
  );
}
