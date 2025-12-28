import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/functions/get-user";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const { from } = Route.useSearch();
  const navigate = useNavigate();

  const trpc = useTRPC();
  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.profileCompleted) {
      if (from === "login") {
        navigate({
          to: "/signup",
          search: { error: "no-account" },
        });
      } else {
        navigate({ to: "/complete-profile" });
      }
    }
  }, [profileQuery.data, from, navigate]);

  if (profileQuery.isLoading) {
    return <Loader />;
  }

  const profile = profileQuery.data;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.firstName || session?.user.name}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
              <CardDescription>Account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Name</span>
                <span className="text-sm">
                  {profile?.firstName} {profile?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Email</span>
                <span className="text-sm">{session?.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge
                  className="bg-green-500/10 text-green-600 dark:text-green-400"
                  variant="secondary"
                >
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
              <CardDescription>Your registered sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No upcoming sessions. Check back later!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
