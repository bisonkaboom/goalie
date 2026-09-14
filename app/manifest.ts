import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Goalie",
    short_name: "Goalie",
    description: "Set a few daily goals, claim the points, keep the streak.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // The icon is a full-bleed orange tile, so the splash stays white rather
    // than taking the brand orange the icon generator proposed — orange on
    // orange would dissolve the icon into its own background.
    background_color: "#ffffff",
    theme_color: "#f15a29",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
