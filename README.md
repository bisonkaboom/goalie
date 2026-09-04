# Goalie

Set a few daily goals, give each one a point value, and claim the points as you
finish them. Built to be used on a phone as an installable PWA, and to work just
as well in a desktop browser.

## Stack

- **Next.js (App Router, TypeScript)** — deployed on Vercel
- **React Bootstrap** — UI
- **Auth.js / NextAuth v5** — Google OAuth sign-in
- **Supabase** — planned, for storing goals and claimed points

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Variable | Where it comes from |
| --- | --- |
| `AUTH_SECRET` | `npx auth secret` (or `openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google Cloud Console OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console OAuth client secret |

### Google OAuth setup

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth client ID** of type **Web application**.
2. Authorized JavaScript origins:
   - `http://localhost:3000`
   - your Vercel production URL
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google`
4. Copy the client ID and secret into `.env.local`.

## Deploying to Vercel

Import the repo in Vercel and set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and
`AUTH_GOOGLE_SECRET` as project environment variables. Vercel supplies the
deployment URL that Auth.js uses for callbacks, so no `AUTH_URL` is needed. Add
the production callback URL to the Google OAuth client before signing in.

## Project layout

```
auth.ts                     Auth.js config (Google provider)
middleware.ts               Keeps the session cookie fresh
app/layout.tsx              Bootstrap CSS, PWA metadata, color mode
app/page.tsx                Signed-in home (goals go here next)
app/signin/page.tsx         Sign-in page
app/manifest.ts             PWA manifest
app/api/auth/[...nextauth]  Auth.js route handlers
components/                 Navbar, auth buttons, brand mark
public/sw.js                Minimal service worker (static asset cache)
public/icons/               PWA icons
```
