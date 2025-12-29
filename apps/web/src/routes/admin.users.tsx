import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import Loader from "@/components/loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUser } from "@/functions/get-user";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());
  const usersQuery = useQuery(trpc.user.listAll.queryOptions());

  const approveMutation = useMutation(
    trpc.user.approve.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.listAll.queryKey(),
        });
        toast.success("User approved successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const revokeMutation = useMutation(
    trpc.user.revoke.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.listAll.queryKey(),
        });
        toast.success("User access revoked");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const setAdminMutation = useMutation(
    trpc.user.setAdmin.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.listAll.queryKey(),
        });
        toast.success(
          variables.isAdmin
            ? "User promoted to admin"
            : "Admin privileges removed"
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  if (profileQuery.isLoading || usersQuery.isLoading) {
    return <Loader />;
  }

  const profile = profileQuery.data;
  const users = usersQuery.data ?? [];

  // Check if user is admin
  if (!profile?.isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldOff className="size-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <a href="/">
                <ArrowLeft className="size-4" data-icon="inline-start" />
                Back to Home
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (
    firstName: string | null,
    lastName: string | null,
    name: string
  ) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (
    firstName: string | null,
    lastName: string | null,
    name: string
  ) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return name;
  };

  const pendingUsers = users.filter((u) => !u.isApproved);
  const approvedUsers = users.filter((u) => u.isApproved);
  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className="min-h-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-32 w-32 translate-y-1/2 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-8">
          {/* Back Button */}
          <Button
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/" })}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="size-4" />
            Back to Sessions
          </Button>

          {/* Title */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="size-5 text-primary" />
              </div>
              <h1 className="font-semibold text-2xl tracking-tight">
                User Management
              </h1>
            </div>
            <p className="ml-[52px] text-muted-foreground">
              Approve access requests and manage platform permissions
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Users className="size-4" />}
              label="Total Users"
              value={users.length}
            />
            <StatCard
              highlight={pendingUsers.length > 0}
              icon={<Clock className="size-4" />}
              label="Pending"
              value={pendingUsers.length}
            />
            <StatCard
              icon={<UserCheck className="size-4" />}
              label="Approved"
              value={approvedUsers.length}
            />
            <StatCard
              icon={<ShieldCheck className="size-4" />}
              label="Admins"
              value={adminCount}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-medium text-lg">Pending Approval</h2>
                <p className="text-muted-foreground text-sm">
                  {pendingUsers.length} user
                  {pendingUsers.length !== 1 ? "s" : ""} waiting for access
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingUsers.map((user, index) => (
                <div
                  className="group relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-4 transition-all duration-200 hover:border-amber-500/40 hover:shadow-amber-500/5 hover:shadow-lg"
                  key={user.id}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 opacity-0 transition-opacity duration-300 group-hover:from-amber-500/5 group-hover:to-transparent group-hover:opacity-100" />

                  <div className="relative">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="ring-2 ring-amber-500/20">
                          {user.image && (
                            <AvatarImage alt={user.name} src={user.image} />
                          )}
                          <AvatarFallback className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            {getInitials(
                              user.firstName,
                              user.lastName,
                              user.name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {getDisplayName(
                              user.firstName,
                              user.lastName,
                              user.name
                            )}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <Badge
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        variant="secondary"
                      >
                        <Clock className="mr-1 size-3" />
                        Pending
                      </Badge>
                      {!user.profileCompleted && (
                        <Badge variant="outline">Incomplete profile</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                        disabled={approveMutation.isPending}
                        onClick={() =>
                          approveMutation.mutate({ userId: user.id })
                        }
                        size="sm"
                      >
                        <Check className="size-4" data-icon="inline-start" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Users */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-lg">All Users</h2>
              <p className="text-muted-foreground text-sm">
                {users.length} registered user{users.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            {users.map((user, index) => (
              <div
                className={cn(
                  "group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50",
                  index !== users.length - 1 && "border-b"
                )}
                key={user.id}
              >
                {/* Avatar */}
                <Avatar className="shrink-0">
                  {user.image && (
                    <AvatarImage alt={user.name} src={user.image} />
                  )}
                  <AvatarFallback
                    className={cn(
                      user.isAdmin
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {getInitials(user.firstName, user.lastName, user.name)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {getDisplayName(user.firstName, user.lastName, user.name)}
                    </p>
                    {user.id === profile.id && (
                      <Badge className="shrink-0" variant="outline">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-muted-foreground text-sm">
                    {user.email}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="hidden items-center gap-2 sm:flex">
                  {user.isApproved ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" />
                      <span className="text-sm">Approved</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="size-4" />
                      <span className="text-sm">Pending</span>
                    </div>
                  )}
                </div>

                {/* Role Badge */}
                <div className="hidden w-24 justify-center sm:flex">
                  {user.isAdmin ? (
                    <Badge
                      className="bg-primary/10 text-primary"
                      variant="secondary"
                    >
                      <ShieldCheck className="mr-1 size-3" />
                      Admin
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">User</span>
                  )}
                </div>

                {/* Join Date */}
                <div className="hidden w-28 text-right lg:block">
                  <span className="text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  {user.id !== profile.id ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {user.isApproved ? (
                          <DropdownMenuItem
                            onClick={() =>
                              revokeMutation.mutate({ userId: user.id })
                            }
                            variant="destructive"
                          >
                            <UserX className="size-4" />
                            Revoke Access
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              approveMutation.mutate({ userId: user.id })
                            }
                          >
                            <Check className="size-4" />
                            Approve User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.isAdmin ? (
                          <DropdownMenuItem
                            onClick={() =>
                              setAdminMutation.mutate({
                                userId: user.id,
                                isAdmin: false,
                              })
                            }
                          >
                            <ShieldOff className="size-4" />
                            Remove Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              setAdminMutation.mutate({
                                userId: user.id,
                                isAdmin: true,
                              })
                            }
                          >
                            <ShieldCheck className="size-4" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="size-9" />
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Users className="size-8 text-muted-foreground" />
                </div>
                <p className="font-medium">No users yet</p>
                <p className="text-muted-foreground text-sm">
                  Users will appear here once they sign up
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}

function StatCard({ icon, label, value, highlight = false }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card/50 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-card",
        highlight && "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={cn(
          "font-semibold text-2xl tabular-nums",
          highlight && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
