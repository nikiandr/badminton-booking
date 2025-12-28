import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";

import GoogleSignInButton from "@/components/google-sign-in-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/functions/get-user";

const searchSchema = z.object({
  error: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
  validateSearch: searchSchema,
  beforeLoad: async () => {
    try {
      const session = await getUser();
      if (session) {
        throw redirect({ to: "/" });
      }
    } catch (error) {
      if (
        error instanceof Response ||
        (error as { isRedirect?: boolean })?.isRedirect
      ) {
        throw error;
      }
    }
  },
});

function RouteComponent() {
  const { error } = Route.useSearch();
  const showNoAccountError = error === "no-account";

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Sign up to join badminton sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNoAccountError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-destructive text-sm">
              You don't have an account yet. Please sign up with Google to
              create one.
            </div>
          )}
          <GoogleSignInButton callbackURL="/complete-profile" mode="signup" />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link className="text-primary hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
