import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/utils/trpc";

interface AccountManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountManagementModal({
  open,
  onOpenChange,
}: AccountManagementModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const profileQuery = useQuery(trpc.user.getProfile.queryOptions());

  const profile = profileQuery.data;

  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");

  const updateProfileMutation = useMutation(
    trpc.user.completeProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["user", "getProfile"] });
        toast.success("Profile updated successfully");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.name) {
      return profile.name.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  };

  // Sync form state when profile data changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && profile) {
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account information and preferences.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {profile?.image && (
                <AvatarImage alt={profile.name} src={profile.image} />
              )}
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {profile?.firstName && profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile?.name}
              </p>
              <p className="text-muted-foreground text-sm">{profile?.email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                value={firstName}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                value={lastName}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input disabled id="email" value={profile?.email ?? ""} />
              <p className="text-muted-foreground text-xs">
                Email cannot be changed as it is linked to your Google account.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button disabled={updateProfileMutation.isPending} type="submit">
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
