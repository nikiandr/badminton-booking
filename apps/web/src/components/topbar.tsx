import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { useState } from "react";

import { AccountManagementModal } from "@/components/account-management-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

export function Topbar() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const profile = profileQuery.data;

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.name) {
      return profile.name.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  const handleOpenAccountModal = () => {
    setAccountModalOpen(true);
  };

  return (
    <>
      <header className="border-border border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Badminton App</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className="rounded-full p-0"
                  size="icon"
                  variant="ghost"
                />
              }
            >
              <Avatar size="sm">
                {profile?.image && (
                  <AvatarImage alt={profile.name} src={profile.image} />
                )}
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
              <div className="px-3 py-2">
                <p className="font-medium text-sm">
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile?.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {profile?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleOpenAccountModal}>
                <Settings className="size-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOut className="size-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AccountManagementModal
        onOpenChange={setAccountModalOpen}
        open={accountModalOpen}
      />
    </>
  );
}
