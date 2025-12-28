import { createFileRoute, Link, redirect } from "@tanstack/react-router";

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

export const Route = createFileRoute("/login")({
  component: RouteComponent,
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
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton callbackURL="/?from=login" mode="signin" />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link className="text-primary hover:underline" to="/signup">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
