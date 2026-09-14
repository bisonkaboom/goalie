import type { Metadata } from "next";
import SettingsForm from "@/components/SettingsForm";
import { readPreferences } from "@/lib/preferences";

export const metadata: Metadata = {
  title: "Settings",
};

/**
 * Reached from the account menu only, and deliberately absent from TabNav —
 * it lives in the (tabs) route group purely to inherit the navbar, so there is
 * still a way back out.
 */
export default async function SettingsPage() {
  const preferences = await readPreferences();

  return (
    <div className="app-reading">
      <h1 className="h4 mb-1">Settings</h1>
      <p className="text-body-secondary mb-3">Saved on this device.</p>
      <SettingsForm preferences={preferences} />
    </div>
  );
}
