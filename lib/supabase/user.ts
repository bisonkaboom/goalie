import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

/**
 * Reads the signed-in user from the access token.
 *
 * `getClaims()` verifies the JWT locally when the project uses asymmetric
 * signing keys, so this costs no network round-trip per render — unlike
 * `getUser()`, which always calls the Auth API.
 *
 * Cached per request because the navbar, the layout and `getProfile` each want
 * it, and the JWT signature check is not free.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) return null;

  // Google populates user_metadata with full_name/avatar_url; older payloads
  // and other providers use name/picture.
  const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = metadata[key];
      if (typeof value === "string" && value) return value;
    }
    return null;
  };

  return {
    id: claims.sub,
    email: claims.email ?? null,
    name: pick("full_name", "name"),
    avatarUrl: pick("avatar_url", "picture"),
  };
});
