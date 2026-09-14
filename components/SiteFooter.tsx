import Link from "next/link";
import Container from "react-bootstrap/Container";
import BrandMark from "@/components/BrandMark";
// Inlined at build time (resolveJsonModule), so the credit line cannot fall
// behind the version that is actually deployed.
import { version } from "@/package.json";

/**
 * The page footer: who made this, and the two legal documents.
 *
 * Rendered on the tab chrome, on sign-in and on the legal pages themselves —
 * which is what makes `/privacy` and `/terms` reachable from the landing page
 * a signed-out visitor sees, as Google's OAuth verification requires. It sits
 * in the flow rather than pinned to the bottom: `body` already carries
 * `min-vh-100` plus safe-area padding, so a nested full-height flex column
 * would total more than the viewport and leave every page a few pixels
 * scrollable.
 *
 * Carries its own Container so each call site is one line, and so the links
 * settle on the same edges as the navbar above them.
 */
export default function SiteFooter() {
  return (
    <Container as="footer" className="app-shell text-center small pt-2 pb-4">
      <p className="d-flex align-items-center justify-content-center gap-2 text-body-secondary mb-1">
        <BrandMark size={20} />
        <span>Goalie {version} is Bison</span>
      </p>
      <nav
        className="d-flex justify-content-center gap-3"
        aria-label="About this site"
      >
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </Container>
  );
}
