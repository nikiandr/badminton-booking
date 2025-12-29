import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import Loader from "@/components/loader";
import { SessionsCalendar } from "@/components/sessions-calendar";
import { SessionsList } from "@/components/sessions-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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
  const isAdmin = profile?.isAdmin ?? false;
  const isApproved = profile?.isApproved ?? false;

  // Show pending approval page for non-approved users who are not admins
  if (!(isApproved || isAdmin)) {
    const handleSignOut = async () => {
      await authClient.signOut();
      navigate({ to: "/login" });
    };

    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Clock className="size-6 text-muted-foreground" />
            </div>
            <CardTitle>Pending Approval</CardTitle>
            <CardDescription className="text-balance">
              Your account is awaiting approval from an administrator. You'll be
              able to access the platform once your account has been approved.
            </CardDescription>
          </CardHeader>
          <div className="flex justify-center px-6 pb-6">
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleCreateSession = () => {
    navigate({ to: "/sessions/create" });
  };

  return (
    <div className="h-full">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-5">
        {/* Page header */}
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
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
          </div>
          {isAdmin && (
            <Button onClick={handleCreateSession} size="sm">
              <Plus className="size-4" data-icon="inline-start" />
              New Session
            </Button>
          )}
        </header>

        {/* Main content */}
        <div className="grid items-stretch gap-5 lg:grid-cols-[1fr_320px]">
          <SessionsList selectedDate={selectedDate} />
          <SessionsCalendar
            onSelectDate={handleDateSelect}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}
