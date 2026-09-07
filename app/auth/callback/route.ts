import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Restricts `?next=` to same-origin paths. A bare `startsWith("/")` check is not
 * enough: `new URL("//evil.com", origin)` resolves to `http://evil.com`, and
 * browsers normalise the backslash in `/\evil.com` to a forward slash.
 */
function safeNext(value: string | null): string {
  if (!value?.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

/**
 * Where Supabase sends the browser back after Google sign-in. Exchanges the
 * one-time code for a session, which @supabase/ssr writes to cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Google surfaces a denied consent screen as an error on the query string.
  const error = searchParams.get("error_description") ?? searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error)}`, origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/signin?error=missing_code", origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, origin),
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
