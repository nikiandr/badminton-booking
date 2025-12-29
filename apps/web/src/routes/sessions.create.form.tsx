import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Euro,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUser } from "@/functions/get-user";
import { useTRPC } from "@/utils/trpc";

const searchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/sessions/create/form")({
  validateSearch: searchSchema,
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
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { from: fromSessionId } = Route.useSearch();

  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());

  // Fetch the source session if copying from existing
  const sourceSessionQuery = useQuery({
    ...trpc.session.getById.queryOptions({ id: fromSessionId || "" }),
    enabled: !!fromSessionId,
  });

  // Check if user is admin
  if (profileQuery.isLoading) {
    return <Loader />;
  }

  if (!profileQuery.data?.isAdmin) {
    navigate({ to: "/" });
    return null;
  }

  // Wait for source session if we're copying
  if (fromSessionId && sourceSessionQuery.isLoading) {
    return <Loader />;
  }

  const sourceSession = sourceSessionQuery.data;

  return (
    <SessionForm
      navigate={navigate}
      queryClient={queryClient}
      sourceSession={sourceSession}
    />
  );
}

interface SourceSession {
  date: Date | string;
  time: string;
  durationMinutes: number;
  costEuros: string;
  paymentLink: string | null;
  places: number;
}

interface SessionFormProps {
  sourceSession?: SourceSession | null;
  navigate: ReturnType<typeof useNavigate>;
  queryClient: ReturnType<typeof useQueryClient>;
}

function SessionForm({
  sourceSession,
  navigate,
  queryClient,
}: SessionFormProps) {
  const trpc = useTRPC();
  const createMutation = useMutation(trpc.session.create.mutationOptions());

  // Default to tomorrow for new sessions
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);

  const form = useForm({
    defaultValues: {
      date: sourceSession ? new Date(sourceSession.date) : defaultDate,
      time: sourceSession?.time || "18:00",
      durationMinutes: sourceSession?.durationMinutes || 90,
      costEuros: sourceSession?.costEuros || "5.00",
      paymentLink: sourceSession?.paymentLink || "",
      places: sourceSession?.places || 8,
    },
    onSubmit: ({ value }) => {
      createMutation.mutate(
        {
          date: value.date,
          time: value.time,
          durationMinutes: value.durationMinutes,
          costEuros: value.costEuros,
          paymentLink: value.paymentLink || "",
          places: value.places,
        },
        {
          onSuccess: () => {
            toast.success("Session created successfully");
            queryClient.invalidateQueries({ queryKey: [["session"]] });
            navigate({ to: "/" });
          },
          onError: (error) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to create session"
            );
          },
        }
      );
    },
  });

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/sessions/create" })}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {sourceSession && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
                <Sparkles className="size-3" />
                From Template
              </span>
            )}
            <h1 className="font-semibold text-2xl tracking-tight">
              {sourceSession ? "Create from Template" : "New Session"}
            </h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            {sourceSession
              ? "Adjust the details below to create your session"
              : "Set up a new badminton session for your players"}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Date & Time Section */}
              <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="border-b bg-muted/30 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-medium">
                    <Calendar className="size-4 text-primary" />
                    Date & Time
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Time */}
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
                            className="h-12 font-medium text-lg"
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            type="time"
                            value={field.state.value}
                          />
                        </div>
                      )}
                    </form.Field>

                    {/* Duration */}
                    <form.Field name="durationMinutes">
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            className="text-muted-foreground text-xs uppercase tracking-wide"
                            htmlFor={field.name}
                          >
                            Duration
                          </Label>
                          <div className="relative">
                            <Input
                              className="h-12 pr-12 font-medium text-lg"
                              id={field.name}
                              min={15}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(Number(e.target.value))
                              }
                              step={15}
                              type="number"
                              value={field.state.value}
                            />
                            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground text-sm">
                              min
                            </span>
                          </div>
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
              </section>

              {/* Session Details Section */}
              <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="border-b bg-muted/30 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-medium">
                    <Users className="size-4 text-primary" />
                    Session Details
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Places */}
                    <form.Field name="places">
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            className="text-muted-foreground text-xs uppercase tracking-wide"
                            htmlFor={field.name}
                          >
                            Available Spots
                          </Label>
                          <div className="relative">
                            <Input
                              className="h-12 pr-16 font-medium text-lg"
                              id={field.name}
                              min={1}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(Number(e.target.value))
                              }
                              type="number"
                              value={field.state.value}
                            />
                            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground text-sm">
                              players
                            </span>
                          </div>
                        </div>
                      )}
                    </form.Field>

                    {/* Cost */}
                    <form.Field name="costEuros">
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            className="text-muted-foreground text-xs uppercase tracking-wide"
                            htmlFor={field.name}
                          >
                            Cost per Person
                          </Label>
                          <div className="relative">
                            <Input
                              className="h-12 pr-14 font-medium text-lg"
                              id={field.name}
                              min="0"
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              step="0.50"
                              type="number"
                              value={field.state.value}
                            />
                            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground text-sm">
                              EUR
                            </span>
                          </div>
                        </div>
                      )}
                    </form.Field>
                  </div>

                  {/* Payment Link */}
                  <form.Field name="paymentLink">
                    {(field) => (
                      <div className="mt-6 space-y-2">
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
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="https://lhv.ee/payment/..."
                          type="url"
                          value={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <form.Subscribe>
                  {(state) => (
                    <Button
                      className="h-12 flex-1 gap-2 font-medium"
                      disabled={
                        !state.canSubmit ||
                        state.isSubmitting ||
                        createMutation.isPending
                      }
                      size="lg"
                      type="submit"
                    >
                      {state.isSubmitting || createMutation.isPending ? (
                        "Creating..."
                      ) : (
                        <>
                          <Check className="size-4" />
                          Create Session
                        </>
                      )}
                    </Button>
                  )}
                </form.Subscribe>
                <Button
                  className="h-12"
                  onClick={() => navigate({ to: "/" })}
                  size="lg"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Right Column - Calendar & Preview */}
            <div className="space-y-6">
              {/* Calendar Card */}
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="border-b bg-muted/30 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-medium">
                    <Calendar className="size-4 text-primary" />
                    Select Date
                  </h2>
                </div>
                <div className="flex justify-center p-4">
                  <form.Field name="date">
                    {(field) => (
                      <CalendarComponent
                        className="rounded-xl"
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        mode="single"
                        onSelect={(date) => date && field.handleChange(date)}
                        selected={field.state.value}
                      />
                    )}
                  </form.Field>
                </div>
              </div>

              {/* Live Preview Card */}
              <form.Subscribe>
                {(state) => (
                  <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b bg-gradient-to-r from-primary/10 to-transparent px-6 py-4">
                      <h2 className="flex items-center gap-2 font-medium">
                        <Sparkles className="size-4 text-primary" />
                        Preview
                      </h2>
                    </div>
                    <div className="p-4">
                      {/* Mini Session Card Preview */}
                      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-muted/20 p-4">
                        {/* Accent line */}
                        <div className="absolute top-0 left-0 h-full w-1 bg-primary" />

                        <div className="pl-3">
                          {/* Date & Time */}
                          <div className="mb-3">
                            <div className="font-semibold text-lg">
                              {format(state.values.date, "EEEE")}
                            </div>
                            <div className="text-muted-foreground">
                              {format(state.values.date, "MMMM d, yyyy")}
                            </div>
                          </div>

                          {/* Time Badge */}
                          <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 font-semibold text-primary">
                            <Clock className="size-4" />
                            {state.values.time}
                          </div>

                          {/* Details Grid */}
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              className="gap-1.5 px-2.5 py-1"
                              variant="outline"
                            >
                              <Timer className="size-3.5" />
                              {state.values.durationMinutes} min
                            </Badge>
                            <Badge
                              className="gap-1.5 px-2.5 py-1"
                              variant="outline"
                            >
                              <Users className="size-3.5" />
                              {state.values.places} spots
                            </Badge>
                            <Badge
                              className="gap-1.5 px-2.5 py-1"
                              variant="secondary"
                            >
                              <Euro className="size-3.5" />
                              {state.values.costEuros}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form.Subscribe>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
