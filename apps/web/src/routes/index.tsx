import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import Loader from "@/components/loader";
import { SessionsCalendar } from "@/components/sessions-calendar";
import { SessionsList } from "@/components/sessions-list";
import { Button } from "@/components/ui/button";
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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleCreateSession = () => {
    navigate({ to: "/sessions/create" });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-5">
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
