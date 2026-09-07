import Container from "react-bootstrap/Container";
import Image from "react-bootstrap/Image";
import Navbar from "react-bootstrap/Navbar";
// Subcomponents are imported from their own modules: `Navbar.Brand` is attached at
// runtime via Object.assign, which a Server Component's client-reference proxy
// cannot see, so `<Navbar.Brand>` resolves to undefined here.
import NavbarBrand from "react-bootstrap/NavbarBrand";
import BrandMark from "@/components/BrandMark";
import { SignOutButton } from "@/components/AuthButtons";
import { getCurrentUser } from "@/lib/supabase/user";

export default async function AppNavbar() {
  const user = await getCurrentUser();

  return (
    <Navbar className="app-navbar border-bottom" sticky="top">
      <Container className="app-container">
        <NavbarBrand href="/" className="d-flex align-items-center gap-2 fw-bold text-brand">
          <BrandMark />
          Goalie
        </NavbarBrand>

        {user ? (
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <div className="d-flex align-items-center gap-2 text-truncate">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  roundedCircle
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="fw-medium text-truncate d-none d-sm-inline">
                {user.name ?? user.email}
              </span>
            </div>
            <SignOutButton />
          </div>
        ) : null}
      </Container>
    </Navbar>
  );
}
