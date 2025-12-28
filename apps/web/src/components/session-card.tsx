import { format } from "date-fns";
import {
  Clock,
  Euro,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BadmintonSession {
  id: string;
  date: Date;
  time: string;
  durationMinutes: number;
  costEuros: string;
  places: number;
  paymentLink?: string | null;
}

interface SessionCardProps {
  session: BadmintonSession;
  isAdmin: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function SessionCard({
  session,
  isAdmin,
  onEdit,
  onDelete,
  onClick,
}: SessionCardProps) {
  const sessionDate = new Date(session.date);
  const isPast = sessionDate < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-border/50 bg-card px-3 py-2.5 ring-1 ring-transparent transition-all duration-150 hover:border-border hover:bg-accent/30 ${isPast ? "opacity-60" : ""} ${onClick ? "cursor-pointer" : ""}`}
      onClick={() => onClick?.(session.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(session.id);
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
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

        {/* Admin actions */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className="size-6 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  size="icon-xs"
                  variant="ghost"
                />
              }
            >
              <MoreHorizontal className="size-3.5" />
              <span className="sr-only">Session actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(session.id);
                }}
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(session.id);
                }}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card px-3 py-2.5">
      <div className="absolute top-0 left-0 h-full w-0.5 animate-pulse bg-muted" />
      <div className="flex items-center gap-3 pl-2.5">
        <div className="space-y-1">
          <div className="h-4 w-8 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="hidden gap-1 sm:flex">
          <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-10 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
