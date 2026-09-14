"use client";

import Link from "next/link";
import Dropdown from "react-bootstrap/Dropdown";
// Subcomponents are imported from their own modules: see AppNavbar. Applied here
// too, even though this module is client-side and dot notation would work, so
// the rule has no exceptions.
import DropdownDivider from "react-bootstrap/DropdownDivider";
import DropdownItem from "react-bootstrap/DropdownItem";
import DropdownMenu from "react-bootstrap/DropdownMenu";
import DropdownToggle from "react-bootstrap/DropdownToggle";
import Image from "react-bootstrap/Image";
import { signOut } from "@/app/auth/actions";

/**
 * The account chip at the right of the navbar: first name, Google picture, and
 * a menu behind them.
 *
 * Split out as the header's second Client Component — like TabNav — so
 * AppNavbar can stay a Server Component and keep awaiting the user.
 */
export default function UserMenu({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <Dropdown align="end">
      {/* The whole chip toggles, not just the name. Clicking the picture you are
          already aiming at and getting nothing would read as broken. */}
      <DropdownToggle
        // `variant="link"` would paint this with --bs-link-color, which is only
        // 2.10:1 against the translucent navbar over a dark cat photo. Body ink
        // measures 7.19:1 there, so the chip uses that instead.
        variant="link"
        className="user-menu-toggle d-flex align-items-center gap-2"
        aria-label={`Account menu for ${name}`}
      >
        <span className="fw-medium text-truncate">{name}</span>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            roundedCircle
            width={32}
            height={32}
            referrerPolicy="no-referrer"
          />
        ) : null}
      </DropdownToggle>

      <DropdownMenu>
        {/* `as={Link}` for the same reason as the tabs: a plain anchor here turns
            every visit into a full document load. */}
        <DropdownItem as={Link} href="/settings">
          Settings
        </DropdownItem>

        <DropdownDivider />

        {/* A form rather than an onClick: `signOut` clears the Supabase session
            cookies and redirects, both of which have to happen on the server. */}
        <form action={signOut}>
          <DropdownItem as="button" type="submit">
            Log out
          </DropdownItem>
        </form>
      </DropdownMenu>
    </Dropdown>
  );
}
