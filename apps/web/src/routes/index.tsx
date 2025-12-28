import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const trpc = useTRPC();
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-bold text-3xl tracking-tight">Badminton App</h1>
          <p className="mt-2 text-muted-foreground">
            Manage and join badminton sessions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Status</CardTitle>
            <CardDescription>Connection to the backend server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {healthCheck.isLoading ? (
                <Badge variant="secondary">Checking...</Badge>
              ) : healthCheck.data ? (
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">Disconnected</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Get Started</CardTitle>
            <CardDescription>
              Sign in to view and register for badminton sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/signup">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
