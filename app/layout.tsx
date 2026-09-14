import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { readPreferences } from "@/lib/preferences";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Goalie",
    template: "%s · Goalie",
  },
  description: "Set a few daily goals, claim the points, keep the streak.",
  applicationName: "Goalie",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Goalie",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111418" },
  ],
};

/**
 * Applies Bootstrap's color mode before first paint so there is no light flash.
 *
 * "light" and "dark" are rendered onto `<html>` below as well, so for those this
 * only re-asserts what the server already sent; "system" is the case that needs
 * resolving here, because the server cannot see the OS setting.
 *
 * The preference is read out of `data-theme-pref` on every call rather than
 * captured once. The settings screen rewrites that attribute when a theme is
 * picked, and a value frozen at page load would let an OS switch at sunset
 * overrule a deliberate choice made since.
 */
const colorModeScript = `
(function () {
  try {
    var root = document.documentElement;
    var query = window.matchMedia("(prefers-color-scheme: dark)");
    var apply = function () {
      var pref = root.getAttribute("data-theme-pref") || "system";
      var dark = pref === "dark" || (pref === "system" && query.matches);
      root.setAttribute("data-bs-theme", dark ? "dark" : "light");
    };
    apply();
    query.addEventListener("change", apply);
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { theme } = await readPreferences();

  return (
    <html
      lang="en"
      className={geistSans.variable}
      // The stored choice, which the script above reads and the settings screen
      // rewrites. Kept separate from data-bs-theme because "system" is a
      // preference, not a palette.
      data-theme-pref={theme}
      // An explicit choice is server-rendered, so the correct palette is in the
      // markup itself. "system" is left off for the script to resolve.
      data-bs-theme={theme === "system" ? undefined : theme}
      suppressHydrationWarning
    >
      <body className="min-vh-100">
        <Script
          id="bs-color-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: colorModeScript }}
        />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
