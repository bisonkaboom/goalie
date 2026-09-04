export { auth as proxy } from "@/auth";

export const config = {
  // Skip Next internals and static assets; everything else refreshes the session.
  matcher: ["/((?!api|_next/static|_next/image|icons|manifest.webmanifest|sw.js|icon.png|apple-icon.png).*)"],
};
