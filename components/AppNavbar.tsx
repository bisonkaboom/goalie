import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
// Subcomponents are imported from their own modules: `Navbar.Brand` is attached at
// runtime via Object.assign, which a Server Component's client-reference proxy
// cannot see, so `<Navbar.Brand>` resolves to undefined here.
import NavbarBrand from "react-bootstrap/NavbarBrand";
import BrandMark from "@/components/BrandMark";
import TabNav from "@/components/TabNav";
import UserMenu from "@/components/UserMenu";
import { getCurrentUser } from "@/lib/supabase/user";

/**
 * The chip says "Bison", not "Bison McCotter-Hulett": the navbar is the one
 * place the name competes for width with the brand and the tabs, and a full
 * name from Google can be long enough to truncate on a phone.
 *
 * Falls back through the email's local part to a generic label, because `name`
 * is read from optional JWT metadata and other providers may not populate it.
 */
function firstName(name: string | null, email: string | null): string {
  const first = name?.trim().split(/\s+/)[0];
  if (first) return first;

  const local = email?.split("@")[0];
  return local || "Account";
}

/**
 * Two stacked rows — identity above, section tabs below — so the tabs stay
 * pinned with the header when the page scrolls.
 */
export default async function AppNavbar() {
  const user = await getCurrentUser();

  return (
    <Navbar className="app-navbar border-bottom p-0" sticky="top">
      <Container className="app-shell flex-column align-items-stretch px-3">
        <div className="d-flex align-items-center justify-content-between py-2">
          <NavbarBrand
            href="/"
            className="d-flex align-items-center gap-2 brand-wordmark text-brand"
          >
            <BrandMark />
            Goalie
          </NavbarBrand>

          {user ? (
            <UserMenu name={firstName(user.name, user.email)} avatarUrl={user.avatarUrl} />
          ) : null}
        </div>

        <TabNav />
      </Container>
    </Navbar>
  );
}
