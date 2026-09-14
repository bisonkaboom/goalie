import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using Goalie.",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="h3">Terms of Service</h1>
      <p className="text-body-secondary">Last updated {LEGAL_LAST_UPDATED}</p>

      <p>
        Goalie is a free daily goal tracker, built and run by one person as a
        personal project. By signing in and using it, you agree to what follows.
        If you do not agree, please do not use it.
      </p>

      <h2 className="h5">Your account</h2>
      <p>
        You sign in with Google, so Goalie has no password of its own. Keep your
        Google account secure — anything done through your sign-in is treated as
        done by you. You must be at least 13 years old to use Goalie.
      </p>

      <h2 className="h5">How you may use it</h2>
      <p>
        Use Goalie to track your own goals. Do not try to reach anyone else&rsquo;s
        data, disrupt the app or the services it runs on, or use it for anything
        unlawful.
      </p>

      <h2 className="h5">Your goals are yours</h2>
      <p>
        The goals, tallies and targets you create belong to you. I claim no
        ownership of them and will not publish them or show them to anyone else.
        Storing them and displaying them back to you is the whole of the
        permission running the app requires.
      </p>

      <h2 className="h5">No warranty</h2>
      <p>
        Goalie is provided as is, free of charge, with no guarantee of any kind.
        It may be unavailable, lose data, or be discontinued without notice. It
        is a scorekeeper for personal habits, not a medical, legal, financial or
        safety tool — do not rely on it as one, and keep your own copy of
        anything you cannot afford to lose.
      </p>

      <h2 className="h5">Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, I am not liable for any loss or
        damage arising from your use of Goalie, including lost data or a missed
        goal.
      </p>

      <h2 className="h5">Ending it</h2>
      <p>
        You can stop using Goalie whenever you like, and you can have your data
        deleted by asking — see the{" "}
        <Link href="/privacy">Privacy Policy</Link>. I may suspend an account
        that is abusing the service, and I may discontinue Goalie altogether.
      </p>

      <h2 className="h5">Changes to these terms</h2>
      <p>
        If these terms change, the date at the top of this page changes with
        them, and continuing to use Goalie means accepting the new version.
      </p>

      <h2 className="h5">Contact</h2>
      <p className="mb-0">
        Questions about these terms:{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
