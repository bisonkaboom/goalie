import Container from "react-bootstrap/Container";
import AppNavbar from "@/components/AppNavbar";
import TimeZoneSync from "@/components/TimeZoneSync";
import { getProfile } from "@/lib/db/queries";

/**
 * Chrome shared by the three tabs.
 *
 * It lives in a route group so `/signin` renders bare — that page has no
 * session, and both `AppNavbar` and `getProfile` assume one. The `<main>`
 * container lives here rather than in each page, so pages are pure content.
 */
export default async function TabsLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();

  return (
    <>
      <AppNavbar />
      <Container as="main" className="app-container py-4">
        {children}
      </Container>
      <TimeZoneSync current={profile.timeZone} />
    </>
  );
}
