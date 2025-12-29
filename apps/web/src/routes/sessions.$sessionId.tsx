import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Euro,
  ExternalLink,
  Pencil,
  Timer,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getUser } from "@/functions/get-user";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/sessions/$sessionId")({
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [isEditing, setIsEditing] = useState(false);

  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());
  const sessionQuery = useQuery(
    trpc.session.getById.queryOptions({ id: sessionId })
  );
  const participantsQuery = useQuery(
    trpc.registration.getParticipants.queryOptions({ sessionId })
  );

  const registerMutation = useMutation(
    trpc.registration.register.mutationOptions()
  );
  const unregisterMutation = useMutation(
    trpc.registration.unregister.mutationOptions()
  );
  const markPaidMutation = useMutation(
    trpc.registration.markAsPaid.mutationOptions()
  );
  const removeParticipantMutation = useMutation(
    trpc.registration.removeParticipant.mutationOptions()
  );
  const deleteSessionMutation = useMutation(
    trpc.session.delete.mutationOptions()
  );

  if (
    profileQuery.isLoading ||
    sessionQuery.isLoading ||
    participantsQuery.isLoading ||
    deleteSessionMutation.isPending ||
    deleteSessionMutation.isSuccess
  ) {
    return <Loader />;
  }

  const profile = profileQuery.data;
  const session = sessionQuery.data;
  const participants = participantsQuery.data ?? [];
  const isAdmin = profile?.isAdmin ?? false;

  if (!session) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <Calendar className="size-8 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">Session not found</p>
        <p className="text-muted-foreground text-sm">
          This session may have been deleted or doesn't exist
        </p>
        <Button onClick={() => navigate({ to: "/" })} variant="outline">
          <ArrowLeft className="size-4" data-icon="inline-start" />
          Back to Sessions
        </Button>
      </div>
    );
  }

  const sessionDate = new Date(session.date);
  const isPast = sessionDate < new Date(new Date().setHours(0, 0, 0, 0));
  const mainParticipants = participants.slice(0, session.places);
  const queueParticipants = participants.slice(session.places);
  const spotsAvailable = Math.max(0, session.places - participants.length);
  const spotsFilled = Math.min(participants.length, session.places);
  const fillPercentage = (spotsFilled / session.places) * 100;

  const currentUserRegistration = participants.find(
    (p) => p.userId === profile?.id
  );
  const isRegistered = !!currentUserRegistration;
  const userPosition = participants.findIndex((p) => p.userId === profile?.id);
  const isInMainList = isRegistered && userPosition < session.places;
  const isInQueue = isRegistered && userPosition >= session.places;
  const hasAlreadyPaid = currentUserRegistration?.hasPaid ?? false;

  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.registration.getParticipants.queryKey({ sessionId }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.session.getById.queryKey({ id: sessionId }),
    });
  };

  const handleRegister = () => {
    registerMutation.mutate(
      { sessionId },
      {
        onSuccess: () => {
          toast.success("You've registered for this session!");
          invalidateQueries();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to register"
          );
        },
      }
    );
  };

  const handleUnregister = () => {
    unregisterMutation.mutate(
      { sessionId },
      {
        onSuccess: () => {
          toast.success("You've unregistered from this session");
          invalidateQueries();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to unregister"
          );
        },
      }
    );
  };

  const handleMarkPaid = () => {
    markPaidMutation.mutate(
      { sessionId },
      {
        onSuccess: () => {
          toast.success("Payment marked as complete!");
          invalidateQueries();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to mark as paid"
          );
        },
      }
    );
  };

  const handleRemoveParticipant = (registrationId: string, name: string) => {
    removeParticipantMutation.mutate(
      { registrationId },
      {
        onSuccess: () => {
          toast.success(`${name} has been removed from the session`);
          invalidateQueries();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to remove participant"
          );
        },
      }
    );
  };

  const handleDeleteSession = () => {
    if (
      !confirm(
        "Are you sure you want to delete this session? This action cannot be undone."
      )
    ) {
      return;
    }

    deleteSessionMutation.mutate(
      { id: sessionId },
      {
        onSuccess: () => {
          toast.success("Session deleted");
          // Remove this specific session from cache to prevent refetch errors
          queryClient.removeQueries({
            queryKey: trpc.session.getById.queryKey({ id: sessionId }),
          });
          queryClient.removeQueries({
            queryKey: trpc.registration.getParticipants.queryKey({ sessionId }),
          });
          // Navigate first, then invalidate list queries
          navigate({ to: "/" });
          queryClient.invalidateQueries({ queryKey: [["session", "list"]] });
          queryClient.invalidateQueries({
            queryKey: [["session", "getSessionDates"]],
          });
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to delete session"
          );
        },
      }
    );
  };

  return (
    <div className="min-h-full">
      {/* Hero Header */}
      <div
        className={cn(
          "relative overflow-hidden border-b",
          isPast
            ? "bg-gradient-to-br from-muted/50 to-muted/30"
            : "bg-gradient-to-br from-primary/10 via-primary/5 to-background"
        )}
      >
        {/* Decorative elements */}
        {!isPast && (
          <>
            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-8">
          {/* Back Button */}
          <Button
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/" })}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="size-4" />
            All Sessions
          </Button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {/* Date Display */}
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {isPast && (
                  <Badge
                    className="bg-muted/80 text-muted-foreground"
                    variant="secondary"
                  >
                    Past Session
                  </Badge>
                )}
                {isAdmin && (
                  <Badge
                    className="bg-primary/10 text-primary"
                    variant="secondary"
                  >
                    Admin
                  </Badge>
                )}
                {isRegistered && !isPast && (
                  <Badge
                    className={cn(
                      isInQueue
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {isInQueue
                      ? `Queue #${userPosition - session.places + 1}`
                      : "Registered"}
                  </Badge>
                )}
              </div>

              {/* Large Date */}
              <div className="flex items-center gap-4">
                <span className="font-bold text-5xl tabular-nums tracking-tight md:text-6xl">
                  {format(sessionDate, "d")}
                </span>
                <div>
                  <p className="font-semibold text-xl md:text-2xl">
                    {format(sessionDate, "MMMM yyyy")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {format(sessionDate, "EEEE")} at{" "}
                    <span className="font-medium text-foreground">
                      {session.time}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Available for ALL users (admin and non-admin) */}
            {!isPast && (
              <div className="flex flex-wrap gap-3">
                {isRegistered ? (
                  <>
                    <Button
                      disabled={unregisterMutation.isPending}
                      onClick={handleUnregister}
                      size="lg"
                      variant="outline"
                    >
                      <UserMinus className="size-4" data-icon="inline-start" />
                      {unregisterMutation.isPending ? "Leaving..." : "Leave"}
                    </Button>
                    {isInMainList && !hasAlreadyPaid && (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={markPaidMutation.isPending}
                        onClick={handleMarkPaid}
                        size="lg"
                      >
                        <CreditCard
                          className="size-4"
                          data-icon="inline-start"
                        />
                        {markPaidMutation.isPending
                          ? "Processing..."
                          : "Mark as Paid"}
                      </Button>
                    )}
                    {isInMainList && hasAlreadyPaid && (
                      <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-5" />
                        <span className="font-medium">Payment Complete</span>
                      </div>
                    )}
                  </>
                ) : (
                  <Button
                    disabled={registerMutation.isPending}
                    onClick={handleRegister}
                    size="lg"
                  >
                    <UserPlus className="size-4" data-icon="inline-start" />
                    {registerMutation.isPending
                      ? "Joining..."
                      : spotsAvailable > 0
                        ? "Join Session"
                        : "Join Queue"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Capacity Bar */}
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {spotsFilled} of {session.places} spots filled
              </span>
              {spotsAvailable > 0 ? (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {spotsAvailable} {spotsAvailable === 1 ? "spot" : "spots"}{" "}
                  left
                </span>
              ) : (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {queueParticipants.length} in queue
                </span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  fillPercentage >= 100
                    ? "bg-amber-500"
                    : fillPercentage >= 75
                      ? "bg-primary"
                      : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Session Info */}
          <div className="space-y-6">
            {isEditing ? (
              <SessionEditForm
                onCancel={() => setIsEditing(false)}
                onSuccess={() => {
                  setIsEditing(false);
                  invalidateQueries();
                }}
                session={session}
              />
            ) : (
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      Session Details
                    </CardTitle>
                    {isAdmin && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        variant="ghost"
                      >
                        <Pencil className="size-4" data-icon="inline-start" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Info Grid */}
                  <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <InfoItem
                      icon={<Clock className="size-5" />}
                      label="Start Time"
                      value={session.time}
                    />
                    <InfoItem
                      icon={<Timer className="size-5" />}
                      label="Duration"
                      value={`${session.durationMinutes} min`}
                    />
                  </div>
                  <Separator />
                  <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <InfoItem
                      icon={<Users className="size-5" />}
                      label="Capacity"
                      value={`${session.places} players`}
                    />
                    <InfoItem
                      icon={<Euro className="size-5" />}
                      label="Cost"
                      value={`€${session.costEuros}`}
                    />
                  </div>

                  {/* Payment Link */}
                  {session.paymentLink && (
                    <>
                      <Separator />
                      <div className="p-4">
                        <a
                          className="flex h-10 w-full items-center justify-between gap-2 rounded-4xl border border-border bg-input/30 px-4 font-medium text-sm transition-colors hover:bg-input/50"
                          href={session.paymentLink}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <span className="flex items-center gap-2">
                            <ExternalLink className="size-4" />
                            Open Payment Link
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </a>
                      </div>
                    </>
                  )}

                  {/* Admin Actions */}
                  {isAdmin && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between gap-3 bg-destructive/5 p-4">
                        <div>
                          <p className="font-medium text-destructive text-sm">
                            Danger Zone
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Permanently delete this session
                          </p>
                        </div>
                        <Button
                          disabled={deleteSessionMutation.isPending}
                          onClick={handleDeleteSession}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="size-4" data-icon="inline-start" />
                          {deleteSessionMutation.isPending ? "..." : "Delete"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Participants */}
          <div className="space-y-6">
            {/* Registered Participants */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="size-5 text-primary" />
                    Players
                  </CardTitle>
                  <Badge variant="secondary">
                    {spotsFilled}/{session.places}
                  </Badge>
                </div>
                {spotsAvailable > 0 && (
                  <CardDescription>
                    {spotsAvailable} {spotsAvailable === 1 ? "spot" : "spots"}{" "}
                    remaining
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {mainParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                      <Users className="size-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No players yet</p>
                    <p className="text-muted-foreground text-sm">
                      Be the first to join this session!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {mainParticipants.map((participant, index) => (
                      <ParticipantRow
                        index={index + 1}
                        isAdmin={isAdmin}
                        isCurrentUser={participant.userId === profile?.id}
                        key={participant.id}
                        onRemove={() =>
                          handleRemoveParticipant(
                            participant.id,
                            getParticipantName(participant)
                          )
                        }
                        participant={participant}
                        removing={removeParticipantMutation.isPending}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Queue */}
            {queueParticipants.length > 0 && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="size-4 text-amber-500" />
                      Waiting List
                    </CardTitle>
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {queueParticipants.length} waiting
                    </Badge>
                  </div>
                  <CardDescription>
                    Will be notified when spots open up
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {queueParticipants.map((participant, index) => (
                      <ParticipantRow
                        index={session.places + index + 1}
                        inQueue
                        isAdmin={isAdmin}
                        isCurrentUser={participant.userId === profile?.id}
                        key={participant.id}
                        onRemove={() =>
                          handleRemoveParticipant(
                            participant.id,
                            getParticipantName(participant)
                          )
                        }
                        participant={participant}
                        removing={removeParticipantMutation.isPending}
                      />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </p>
        <p className="font-semibold text-lg">{value}</p>
      </div>
    </div>
  );
}

interface Participant {
  id: string;
  userId: string;
  hasPaid: boolean;
  registeredAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  };
}

function getParticipantName(participant: Participant): string {
  return (
    `${participant.user.firstName || ""} ${participant.user.lastName || ""}`.trim() ||
    participant.user.email
  );
}

interface ParticipantRowProps {
  participant: Participant;
  index: number;
  isAdmin: boolean;
  isCurrentUser: boolean;
  onRemove: () => void;
  removing: boolean;
  inQueue?: boolean;
}

function ParticipantRow({
  participant,
  index,
  isAdmin,
  isCurrentUser,
  onRemove,
  removing,
  inQueue = false,
}: ParticipantRowProps) {
  const name = getParticipantName(participant);

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
        isCurrentUser
          ? "bg-primary/10 ring-1 ring-primary/30"
          : "hover:bg-muted/50"
      )}
    >
      {/* Position */}
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-xs",
          inQueue
            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
            : isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        )}
      >
        {index}
      </span>

      {/* Avatar */}
      {participant.user.image ? (
        <img
          alt={name}
          className="size-9 shrink-0 rounded-full object-cover ring-2 ring-background"
          src={participant.user.image}
        />
      ) : (
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm uppercase ring-2 ring-background",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-gradient-to-br from-muted to-muted/50 text-muted-foreground"
          )}
        >
          {name.charAt(0)}
        </div>
      )}

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">
          {name}
          {isCurrentUser && (
            <span className="ml-1 text-primary text-xs">(you)</span>
          )}
        </p>
      </div>

      {/* Status Badge */}
      {!inQueue && participant.hasPaid && (
        <Badge className="shrink-0 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Check className="size-3" />
          Paid
        </Badge>
      )}

      {/* Admin Remove */}
      {isAdmin && (
        <Button
          className="size-7 shrink-0 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
          disabled={removing}
          onClick={onRemove}
          size="icon-xs"
          variant="ghost"
        >
          <X className="size-4 text-muted-foreground hover:text-destructive" />
          <span className="sr-only">Remove participant</span>
        </Button>
      )}
    </li>
  );
}

interface SessionEditFormProps {
  session: {
    id: string;
    date: Date;
    time: string;
    durationMinutes: number;
    costEuros: string;
    paymentLink: string | null;
    places: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function SessionEditForm({
  session,
  onSuccess,
  onCancel,
}: SessionEditFormProps) {
  const trpc = useTRPC();
  const updateMutation = useMutation(trpc.session.update.mutationOptions());

  const form = useForm({
    defaultValues: {
      date: new Date(session.date),
      time: session.time,
      durationMinutes: session.durationMinutes,
      costEuros: session.costEuros,
      paymentLink: session.paymentLink || "",
      places: session.places,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate(
        {
          id: session.id,
          data: {
            date: value.date,
            time: value.time,
            durationMinutes: value.durationMinutes,
            costEuros: value.costEuros,
            paymentLink: value.paymentLink || "",
            places: value.places,
          },
        },
        {
          onSuccess: () => {
            toast.success("Session updated successfully");
            onSuccess();
          },
          onError: (error) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update session"
            );
          },
        }
      );
    },
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pencil className="size-5 text-primary" />
              Edit Session
            </CardTitle>
            <CardDescription>Update the session details</CardDescription>
          </div>
          <Button onClick={onCancel} size="icon-sm" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {/* Date Calendar */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Date
            </Label>
            <form.Field name="date">
              {(field) => (
                <div className="flex justify-center overflow-hidden rounded-xl border bg-muted/20">
                  <CalendarComponent
                    mode="single"
                    onSelect={(date) => date && field.handleChange(date)}
                    selected={field.state.value}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Time & Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="time">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    className="text-muted-foreground text-xs uppercase tracking-wide"
                    htmlFor={field.name}
                  >
                    Start Time
                  </Label>
                  <Input
                    className="h-12"
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="time"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="durationMinutes">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    className="text-muted-foreground text-xs uppercase tracking-wide"
                    htmlFor={field.name}
                  >
                    Duration (minutes)
                  </Label>
                  <Input
                    className="h-12"
                    id={field.name}
                    min={15}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    step={15}
                    type="number"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Places & Cost */}
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="places">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    className="text-muted-foreground text-xs uppercase tracking-wide"
                    htmlFor={field.name}
                  >
                    Available Spots
                  </Label>
                  <Input
                    className="h-12"
                    id={field.name}
                    min={1}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    type="number"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="costEuros">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    className="text-muted-foreground text-xs uppercase tracking-wide"
                    htmlFor={field.name}
                  >
                    Cost (EUR)
                  </Label>
                  <Input
                    className="h-12"
                    id={field.name}
                    min="0"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    step="0.50"
                    type="number"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Payment Link */}
          <form.Field name="paymentLink">
            {(field) => (
              <div className="space-y-2">
                <Label
                  className="text-muted-foreground text-xs uppercase tracking-wide"
                  htmlFor={field.name}
                >
                  Payment Link{" "}
                  <span className="text-muted-foreground/60 normal-case">
                    (optional)
                  </span>
                </Label>
                <Input
                  className="h-12"
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="https://lhv.ee/payment/..."
                  type="url"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <form.Subscribe>
              {(state) => (
                <Button
                  className="flex-1"
                  disabled={
                    !state.canSubmit ||
                    state.isSubmitting ||
                    updateMutation.isPending
                  }
                  size="lg"
                  type="submit"
                >
                  {state.isSubmitting || updateMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="size-4" data-icon="inline-start" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
            <Button
              onClick={onCancel}
              size="lg"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
