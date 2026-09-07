/**
 * Supabase connection details, read once so a missing value fails loudly with a
 * useful message instead of surfacing as an opaque 401 from the Auth API.
 *
 * Supabase renamed its browser-safe key from `anon` (a JWT) to a publishable
 * key (`sb_publishable_...`). Either is accepted here so the app works whichever
 * one the project dashboard hands out.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy it from the Supabase dashboard (Project Settings > API Keys) into .env.`,
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
