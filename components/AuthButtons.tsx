import Button from "react-bootstrap/Button";
import { signIn, signOut } from "@/auth";
import GoogleIcon from "@/components/GoogleIcon";

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/" });
      }}
    >
      <Button
        type="submit"
        variant="light"
        size="lg"
        className="w-100 d-flex align-items-center justify-content-center gap-2 border shadow-sm fw-semibold"
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/signin" });
      }}
    >
      <Button type="submit" variant="outline-secondary" size="sm">
        Sign out
      </Button>
    </form>
  );
}
