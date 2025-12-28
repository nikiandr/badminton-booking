import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import Loader from "@/components/loader";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/functions/get-user";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/")({
  component: RouteComponent,
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

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
    <div className="h-full overflow-auto bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4">
        <header className="mb-6">
          <h1 className="font-semibold text-xl tracking-tight">
            Welcome back, {profile?.firstName || "Player"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <CardTitle className="font-medium text-base">
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
                <div className="rounded-full bg-muted p-3">
                  <svg
                    className="size-6 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground text-sm">
                  No upcoming sessions
                </p>
                <p className="text-muted-foreground/70 text-xs">
                  Sessions you register for will appear here
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/30 pb-3">
              <CardTitle className="font-medium text-base">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-4">
              <Calendar
                mode="single"
                onSelect={setSelectedDate}
                selected={selectedDate}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
