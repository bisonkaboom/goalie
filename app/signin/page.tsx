import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import BrandMark from "@/components/BrandMark";
import SiteFooter from "@/components/SiteFooter";
import { SignInButton } from "@/components/AuthButtons";
import { getCurrentUser } from "@/lib/supabase/user";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/signin">) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? error : null;

  return (
    <Container
      as="main"
      className="d-flex flex-column justify-content-center min-vh-100 py-5"
      // Narrower than any shared width: this page is one card, centred.
      style={{ maxWidth: 420 }}>
      <div className="text-center mb-4">
        <span className="d-inline-flex">
          <BrandMark size={56} />
        </span>
        <h1 className="brand-wordmark brand-wordmark-lg text-brand mt-3 mb-1">
          Goalie
        </h1>
        <p className="text-body-secondary mb-0">
          Set a few daily goals, claim the points, keep the streak.
        </p>
      </div>

      <Card body className="bg-body-tertiary border-0 shadow-sm">
        {errorMessage ? (
          <p className="text-danger small text-center mb-3" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <SignInButton />
        <p className="text-body-secondary small text-center mt-3 mb-0">
          We only use your Google account to sign you in.
        </p>
      </Card>

      {/* Inside the centred column rather than after it: this page is a full
          viewport of vertical centring, so a footer placed as a sibling would
          be pushed a screen below the card. It is also the one place the legal
          links have to be reachable without a session — Google's OAuth review
          reads them from here, since `/` redirects a signed-out visitor to this
          page. */}
      <div className="mt-4">
        <SiteFooter />
      </div>
    </Container>
  );
}
