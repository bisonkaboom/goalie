import Link from "next/link";
import Container from "react-bootstrap/Container";
import BrandMark from "@/components/BrandMark";
import SiteFooter from "@/components/SiteFooter";

/**
 * Chrome for the two legal documents.
 *
 * A route group rather than a `/legal` segment, so the URLs stay `/terms` and
 * `/privacy` — short enough to read aloud, and they are typed by hand into the
 * Google Cloud Console consent screen.
 *
 * Deliberately not the `(tabs)` chrome: `AppNavbar` and `getProfile` both
 * assume a session, and these pages are listed in the proxy's PUBLIC_PATHS so
 * that Google's OAuth reviewer — who is not signed in — can reach them. The
 * wordmark links home, which lands a visitor on sign-in and a signed-in user on
 * their score.
 */
// `LayoutProps<"/">`, not `<"/terms">`: a route group adds no URL segment, so
// the generated LayoutRoutes knows this layout — like the (tabs) one — only by
// the path it sits at.
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Container as="main" className="app-reading py-4">
        <Link
          href="/"
          className="d-inline-flex align-items-center gap-2 brand-wordmark text-brand text-decoration-none mb-4"
        >
          <BrandMark />
          <span className="brand-wordmark-text">Goalie</span>
        </Link>

        {/* `.legal-prose` tightens the heading rhythm; Bootstrap's default
            margins are sized for headings that introduce components, not for a
            dozen short sections of prose in a row. */}
        <div className="legal-prose">{children}</div>
      </Container>

      <SiteFooter />
    </>
  );
}
