import Container from "react-bootstrap/Container";
import Image from "react-bootstrap/Image";
import Navbar from "react-bootstrap/Navbar";
import { auth } from "@/auth";
import BrandMark from "@/components/BrandMark";
import { SignOutButton } from "@/components/AuthButtons";

export default async function AppNavbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <Navbar className="app-navbar border-bottom" sticky="top">
      <Container className="app-container">
        <Navbar.Brand href="/" className="d-flex align-items-center gap-2 fw-bold text-brand">
          <BrandMark />
          Goalie
        </Navbar.Brand>

        {user ? (
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <div className="d-flex align-items-center gap-2 text-truncate">
              {user.image ? (
                <Image
                  src={user.image}
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
