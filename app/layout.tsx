import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

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

// Applies Bootstrap's color mode before first paint so there is no light flash.
const colorModeScript = `
(function () {
  try {
    var dark = window.matchMedia("(prefers-color-scheme: dark)");
    var apply = function (isDark) {
      document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");
    };
    apply(dark.matches);
    dark.addEventListener("change", function (e) { apply(e.matches); });
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorModeScript }} />
      </head>
      <body className="min-vh-100">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
