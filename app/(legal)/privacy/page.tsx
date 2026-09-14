import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Goalie stores, who else sees it, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="h3">Privacy Policy</h1>
      <p className="text-body-secondary">Last updated {LEGAL_LAST_UPDATED}</p>

      <p>
        Goalie is a daily goal tracker built and run by one person. The short
        version: it stores the goals you create and the basic profile on your
        Google account, so that it can show your score back to you. Nothing is
        sold, and there is no advertising and no analytics.
      </p>

      <h2 className="h5">What Google shares when you sign in</h2>
      <p>
        Signing in asks Google for your name, email address and profile picture,
        and nothing else. Goalie cannot read your Gmail, Drive, Calendar or
        Contacts, and cannot act on your behalf in your Google account. Sign-in
        is brokered by Supabase, so Goalie never sees your Google password.
      </p>
      <p>
        Goalie&rsquo;s use of information received from Google APIs follows the
        Google API Services User Data Policy, including its Limited Use
        requirements.
      </p>

      <h2 className="h5">What Goalie stores</h2>
      <ul>
        <li>Your name, email address and profile picture URL, from Google.</li>
        <li>
          The goals you create: name, emoji, whether the goal counts up or down,
          its time of day, and its point value.
        </li>
        <li>Your tallies — how many times you logged each goal, on which day.</li>
        <li>Your daily points target.</li>
        <li>
          Your device&rsquo;s time zone, so that a day rolls over on your clock
          rather than at UTC midnight.
        </li>
      </ul>
      <p>
        That is the whole list. There is no location data, no contact list, no
        device identifier, and no free-text field beyond the names you give your
        own goals.
      </p>

      <h2 className="h5">Cookies</h2>
      <p>
        A sign-in cookie from Supabase keeps you signed in between visits, and
        two small cookies remember your colour theme and background choice.
        Those two hold only the option you picked and cannot be read by
        JavaScript. There are no advertising or tracking cookies of any kind.
      </p>

      <h2 className="h5">Who else handles your data</h2>
      <ul>
        <li>
          <strong>Google</strong> — sign-in.
        </li>
        <li>
          <strong>Supabase</strong> — the database your goals live in, and the
          service that manages sign-in.
        </li>
        <li>
          <strong>Vercel</strong> — hosting, which means it processes the web
          requests your browser makes.
        </li>
        <li>
          <strong>Animal photo sources</strong> — if a background is switched on,
          your browser loads a photo straight from cataas.com, dog.ceo,
          randomfox.ca or random-d.uk, so that site sees your IP address and
          browser the way any website you visit would. It receives nothing about
          your account or your goals. Cat photos are on by default; Settings
          &rarr; Background &rarr; None turns this off.
        </li>
      </ul>
      <p>
        Your data is not sold, rented, or shared for advertising, and it is not
        used to train AI models. Nobody else is sent your goals.
      </p>

      <h2 className="h5">How long it is kept, and how to delete it</h2>
      <p>
        Your data is kept as long as your account exists. Goalie has no in-app
        delete button yet, so email{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> from
        the address you signed in with and your account, along with every goal,
        tally and target attached to it, will be deleted. You can also ask for a
        copy of what is stored about you.
      </p>

      <h2 className="h5">Security</h2>
      <p>
        Every table is protected by Postgres row level security, so a query runs
        as you and can only ever return your own rows — the app has no
        administrative key that could read across accounts. Traffic is encrypted
        in transit. No system is perfectly secure, and Goalie makes no guarantee
        against a breach.
      </p>

      <h2 className="h5">Children</h2>
      <p>
        Goalie is not intended for children under 13, and their data is not
        knowingly collected.
      </p>

      <h2 className="h5">Changes to this policy</h2>
      <p>
        If this policy changes, the date at the top of this page changes with it.
      </p>

      <h2 className="h5">Contact</h2>
      <p className="mb-0">
        Questions, or a deletion request:{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. See
        also the <Link href="/terms">Terms of Service</Link>.
      </p>
    </>
  );
}
