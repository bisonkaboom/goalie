import { redirect } from "next/navigation";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <AppNavbar />
      <Container as="main" className="app-container py-4">
        <h1 className="h4 mb-1">Hi, {firstName}</h1>
        <p className="text-body-secondary mb-4">Here is where today&apos;s goals will live.</p>

        <Card body className="bg-body-tertiary border-0">
          <Card.Title as="h2" className="h6">
            Daily goals
          </Card.Title>
          <Card.Text className="text-body-secondary mb-0 small">
            Nothing set up yet. Next up: create goals, give each one a point value, and
            claim the points as you finish them.
          </Card.Text>
        </Card>
      </Container>
    </>
  );
}
