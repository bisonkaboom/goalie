"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import Nav from "react-bootstrap/Nav";
// Subpath imports: see AppNavbar. Applied here too, even though this module is
// client-side and dot notation would work, so the rule has no exceptions.
import NavLink from "react-bootstrap/NavLink";

/** `null` is the index segment, so it doubles as Home's identity. */
const TABS = [
  { segment: null, href: "/", label: "Home" },
  { segment: "track", href: "/track", label: "Track" },
  { segment: "setup", href: "/setup", label: "Setup" },
] as const;

/**
 * The only client-side piece of the header, split out so AppNavbar can stay a
 * Server Component and keep awaiting the user for the avatar.
 */
export default function TabNav() {
  // Reads the active child of the (tabs) layout: null | "track" | "setup".
  // Cheaper than usePathname and immune to trailing slashes.
  const segment = useSelectedLayoutSegment();

  return (
    <Nav
      as="nav"
      variant="underline"
      aria-label="Sections"
      className="justify-content-around flex-nowrap"
    >
      {TABS.map((tab) => {
        const isActive = tab.segment === segment;
        return (
          <NavLink
            key={tab.href}
            // Without `as={Link}` this renders a plain anchor and every tab
            // switch becomes a full document load.
            as={Link}
            href={tab.href}
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
