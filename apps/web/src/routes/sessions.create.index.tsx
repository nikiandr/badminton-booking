import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Copy,
  Euro,
  Users,
} from "lucide-react";
import { useState } from "react";

import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUser } from "@/functions/get-user";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/sessions/create/")({
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [showExistingDialog, setShowExistingDialog] = useState(false);

  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());

  // Check if user is admin
  if (profileQuery.isLoading) {
    return <Loader />;
  }

  if (!profileQuery.data?.isAdmin) {
    navigate({ to: "/" });
    return null;
  }

  const handleFromScratch = () => {
    navigate({ to: "/sessions/create/form" });
  };

  const handleFromExisting = () => {
    setShowExistingDialog(true);
  };

  const handleSelectSession = (sessionId: string) => {
    setShowExistingDialog(false);
    navigate({
      to: "/sessions/create/form",
      search: { from: sessionId },
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-5">
        {/* Back button */}
        <Button
          className="mb-6"
          onClick={() => navigate({ to: "/" })}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="size-4" />
          Back to Sessions
        </Button>

        {/* Page header */}
        <header className="mb-8 text-center">
          <h1 className="mb-2 font-semibold text-2xl tracking-tight">
            Create New Session
          </h1>
          <p className="text-muted-foreground">
            Choose how you want to create your badminton session
          </p>
        </header>

        {/* Two cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* From Existing */}
          <Card
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={handleFromExisting}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Copy className="size-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">
                Start from Existing Session
              </CardTitle>
              <CardDescription>
                Copy settings from a previous session and modify as needed
              </CardDescription>
            </CardHeader>
          </Card>

          {/* From Scratch */}
          <Card
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            onClick={handleFromScratch}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <CalendarPlus className="size-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Create from Scratch</CardTitle>
              <CardDescription>
                Start fresh with a blank session form
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Existing Sessions Dialog */}
        <ExistingSessionsDialog
          onOpenChange={setShowExistingDialog}
          onSelect={handleSelectSession}
          open={showExistingDialog}
        />
      </div>
    </div>
  );
}

interface ExistingSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (sessionId: string) => void;
}

function ExistingSessionsDialog({
  open,
  onOpenChange,
  onSelect,
}: ExistingSessionsDialogProps) {
  const trpc = useTRPC();

  // Fetch all past sessions sorted by date
  const sessionsQuery = useQuery({
    ...trpc.session.list.queryOptions({ type: "past" }),
    enabled: open,
  });

  // Also fetch upcoming sessions to show all available
  const upcomingQuery = useQuery({
    ...trpc.session.list.queryOptions({ type: "upcoming" }),
    enabled: open,
  });

  const allSessions = [
    ...(upcomingQuery.data || []),
    ...(sessionsQuery.data || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a Session to Copy</DialogTitle>
          <DialogDescription>
            Choose an existing session to use as a template
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {sessionsQuery.isLoading || upcomingQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : allSessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No existing sessions found
            </div>
          ) : (
            <div className="space-y-2">
              {allSessions.map((session) => (
                <SessionListItem
                  key={session.id}
                  onClick={() => onSelect(session.id)}
                  session={session}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SessionListItemProps {
  session: {
    id: string;
    date: Date | string;
    time: string;
    durationMinutes: number;
    costEuros: string;
    places: number;
  };
  onClick: () => void;
}

function SessionListItem({ session, onClick }: SessionListItemProps) {
  const sessionDate = new Date(session.date);
  const isPast = sessionDate < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <button
      className={`group relative w-full overflow-hidden rounded-lg border border-border/50 bg-card px-3 py-2.5 text-left ring-1 ring-transparent transition-all duration-150 hover:border-border hover:bg-accent/30 ${isPast ? "opacity-60" : ""}`}
      onClick={onClick}
      type="button"
    >
      {/* Accent line */}
      <div
        className={`absolute top-0 left-0 h-full w-0.5 ${isPast ? "bg-muted-foreground/30" : "bg-primary"}`}
      />

      <div className="flex items-center justify-between gap-2 pl-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Date block */}
          <div className="flex-shrink-0">
            <div className="font-semibold text-sm leading-tight">
              {format(sessionDate, "EEE")}
            </div>
            <div className="text-muted-foreground text-xs">
              {format(sessionDate, "MMM d")}
            </div>
          </div>

          {/* Time */}
          <div className="font-medium text-primary text-sm tabular-nums">
            {session.time}
          </div>

          {/* Details */}
          <div className="hidden flex-wrap gap-1 sm:flex">
            <Badge className="h-5 gap-0.5 px-1.5 text-xs" variant="outline">
              <Clock className="size-2.5" />
              {session.durationMinutes}m
            </Badge>
            <Badge className="h-5 gap-0.5 px-1.5 text-xs" variant="outline">
              <Users className="size-2.5" />
              {session.places}
            </Badge>
            <Badge className="h-5 gap-0.5 px-1.5 text-xs" variant="secondary">
              <Euro className="size-2.5" />
              {session.costEuros}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
}
