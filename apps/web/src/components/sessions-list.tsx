import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  type BadmintonSession,
  SessionCard,
  SessionCardSkeleton,
} from "@/components/session-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/utils/trpc";

interface SessionsListProps {
  selectedDate?: Date;
}

export function SessionsList({ selectedDate }: SessionsListProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const sessionsQuery = useQuery(
    trpc.session.list.queryOptions({
      type: activeTab,
      date: selectedDate,
    })
  );

  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());
  const isAdmin = profileQuery.data?.isAdmin ?? false;

  const deleteMutation = useMutation(
    trpc.session.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Session deleted successfully");
        queryClient.invalidateQueries({ queryKey: [["session", "list"]] });
        queryClient.invalidateQueries({
          queryKey: [["session", "getSessionDates"]],
        });
      },
      onError: (error) => {
        toast.error(`Failed to delete session: ${error.message}`);
      },
    })
  );

  const handleEdit = (id: string) => {
    navigate({ to: "/sessions/$sessionId/edit", params: { sessionId: id } });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleSessionClick = (id: string) => {
    navigate({ to: "/sessions/$sessionId", params: { sessionId: id } });
  };

  return (
    <div className="flex min-w-0 flex-col">
      <Tabs
        className="flex flex-1 flex-col"
        onValueChange={(v) => setActiveTab(v as "upcoming" | "past")}
        value={activeTab}
      >
        <div className="mb-3 flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          {selectedDate && (
            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary text-xs">
              {selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        <TabsContent className="mt-0 flex-1" value="upcoming">
          <SessionsContent
            emptyDescription="New sessions will appear here"
            emptyMessage="No upcoming sessions"
            isAdmin={isAdmin}
            isLoading={sessionsQuery.isLoading}
            onClick={handleSessionClick}
            onDelete={handleDelete}
            onEdit={handleEdit}
            sessions={sessionsQuery.data as BadmintonSession[] | undefined}
          />
        </TabsContent>

        <TabsContent className="mt-0 flex-1" value="past">
          <SessionsContent
            emptyDescription="Completed sessions appear here"
            emptyMessage="No past sessions"
            isAdmin={isAdmin}
            isLoading={sessionsQuery.isLoading}
            onClick={handleSessionClick}
            onDelete={handleDelete}
            onEdit={handleEdit}
            sessions={sessionsQuery.data as BadmintonSession[] | undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SessionsContentProps {
  sessions: BadmintonSession[] | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  emptyMessage: string;
  emptyDescription: string;
}

function SessionsContent({
  sessions,
  isLoading,
  isAdmin,
  onEdit,
  onDelete,
  onClick,
  emptyMessage,
  emptyDescription,
}: SessionsContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <SessionCardSkeleton />
        <SessionCardSkeleton />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-border/60 border-dashed bg-muted/5 text-center">
        <CalendarDays className="size-5 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-muted-foreground/60 text-sm">
            {emptyMessage}
          </p>
          <p className="text-muted-foreground/40 text-xs">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionCard
          isAdmin={isAdmin}
          key={session.id}
          onClick={onClick}
          onDelete={onDelete}
          onEdit={onEdit}
          session={session}
        />
      ))}
    </div>
  );
}
