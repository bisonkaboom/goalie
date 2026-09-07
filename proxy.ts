import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/** Routes reachable without a session. Everything else redirects to /signin. */
const PUBLIC_PATHS = ["/signin", "/auth"];

export async function proxy(request: NextRequest) {
  // Mutated by setAll below: Supabase writes refreshed tokens onto this response.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Update the request so the rendered route sees the refreshed tokens,
        // then rebuild the response so it carries them too.
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Cache-Control/Expires/Pragma from @supabase/ssr. Without these a CDN
        // could cache a Set-Cookie response and hand one user's session to
        // another.
        for (const [key, headerValue] of Object.entries(headers)) {
          response.headers.set(key, headerValue);
        }
      },
    },
  });

  // Must run before the response is generated, otherwise a refresh that lands
  // late cannot write its cookies and the session is silently lost.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!isSignedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  if (isSignedIn && pathname === "/signin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip Next internals and static assets; everything else refreshes the session.
  matcher: [
    "/((?!_next/static|_next/image|icons|manifest.webmanifest|sw.js|icon.png|apple-icon.png).*)",
  ],
};
