import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import BrandMark from "@/components/BrandMark";
import { SignInButton } from "@/components/AuthButtons";
import { getCurrentUser } from "@/lib/supabase/user";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? error : null;

  return (
    <Container
      as="main"
      className="app-container d-flex flex-column justify-content-center min-vh-100 py-5"
      style={{ maxWidth: 420 }}
    >
      <div className="text-center mb-4">
        <span className="text-brand d-inline-flex">
          <BrandMark size={56} />
        </span>
        <h1 className="h3 fw-bold mt-3 mb-1">Goalie</h1>
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
    </Container>
  );
}
