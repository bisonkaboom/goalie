"use client";

import { useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import GoogleIcon from "@/components/GoogleIcon";

/**
 * Starts the OAuth flow from the browser so @supabase/ssr can store the PKCE
 * code verifier in a cookie, which /auth/callback then reads to redeem the code.
 */
export function SignInButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setPending(false);
    }
    // On success the browser navigates to Google, so `pending` stays true.
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        variant="light"
        size="lg"
        className="w-100 d-flex align-items-center justify-content-center gap-2 border shadow-sm fw-semibold"
      >
        {pending ? (
          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error ? (
        <p className="text-danger small text-center mt-3 mb-0" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline-secondary" size="sm">
        Sign out
      </Button>
    </form>
  );
}
