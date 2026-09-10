# Goalie

Set a few daily goals, give each one a point value, and claim the points as you
finish them. Built to be used on a phone as an installable PWA, and to work just
as well in a desktop browser.

Goals come in two flavours. **Do More** goals are things you want to do each day
and score positively. **Do Less** goals are habits you want to curtail and count
against the day's total. The net is measured against a personal daily points
target.

## Stack

- **Next.js 16 (App Router, TypeScript)** — deployed on Vercel
- **React Bootstrap** — UI
- **Supabase** — Postgres, row level security, and Google OAuth sign-in

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the two values below
npm run dev
```

### Environment variables

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API Keys |

Older projects show a JWT labelled `anon` instead of an `sb_publishable_…` key.
Either works — name the variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` if that is what
your dashboard gives you.

No secret or `service_role` key is needed. Every query runs as the signed-in
user and is scoped by row level security.

### Database

Apply the migrations in `supabase/migrations/` in order:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

1. `20260909120000_goalie_schema.sql` — tables, RLS policies, and the
   `day_scores` function
2. `20260909120100_tally_integrity_and_atomic_adjust.sql` — the `adjust_tally`
   function and tally ownership constraints

Both are idempotent, so they can also be pasted straight into the dashboard's
SQL editor if you would rather not link the project.

### Google OAuth setup

Supabase brokers the OAuth flow, so Google never sees this app's URL — the
client ID and secret live in the Supabase dashboard rather than in `.env`.

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth client ID** of type **Web application**.
2. Authorized redirect URI — this one, and only this one:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste the client ID and secret into Supabase → Authentication → Sign In /
   Providers → Google.
4. Supabase → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (your production URL in prod)
   - Redirect URLs: `http://localhost:3000/**`

## How scoring works

A goal's identity — name and emoji — lives on the `goals` row and is not dated,
so renaming applies to all history. Anything that affects scoring is
**effective dated**:

- `goal_settings` holds `(goal_id, effective_on, points, is_enabled)`
- `daily_targets` holds `(user_id, effective_on, points)`

A day's score resolves each goal to the most recent row on or before that day.
Raising a goal from 10 to 20 points today leaves yesterday scored at 10.
Changing it twice in one day overwrites that day's row rather than appending,
courtesy of `unique (goal_id, effective_on)` plus an upsert.

`day_scores(start_day, end_day)` does this resolution in SQL for a whole range,
so a week or month chart prices each day correctly even across a value change.

Two consequences worth knowing:

- A goal's **direction is fixed at creation**. `day_scores` reads it live, so
  allowing an edit would retroactively re-sign every past tally.
- There is **no delete**, only an Active toggle. Deleting would cascade to the
  tallies and silently rewrite past scores.

## Project layout

```
proxy.ts                    Auth gate + Supabase session refresh (Next 16's middleware)
app/layout.tsx              Bootstrap CSS, PWA metadata, color mode
app/(tabs)/layout.tsx       Shared chrome for the three tabs
app/(tabs)/page.tsx         Home — today's score
app/(tabs)/track/page.tsx   Track — tally goals up and down
app/(tabs)/setup/page.tsx   Setup — daily target, add and edit goals
app/signin/page.tsx         Sign-in (deliberately outside the tab chrome)
app/auth/                   OAuth callback route and the sign-out action
app/actions/goals.ts        Server actions: saveGoal, adjustTally, setDailyTarget
lib/supabase/               Browser and server clients, current user
lib/db/                     Queries and types
lib/dates.ts                Calendar-day helpers in the user's time zone
components/DayChart.tsx     One day's score — the reusable scoring primitive
supabase/migrations/        Schema
public/sw.js                Minimal service worker (static asset cache)
```

`DayChart` renders as text today. It takes a positive, a negative and a target,
and is deliberately presentational so the eventual visx implementation drops in
behind the same props — for a single day on Home, or many at once for a range.

## Deploying to Vercel

Import the repo and set the two `NEXT_PUBLIC_SUPABASE_*` variables as project
environment variables. Add the production URL to Supabase's Site URL and
Redirect URLs before signing in.
