"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileForm } from "@/components/features/users/profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-8">
        <p className="text-muted-foreground">Please log in to edit your profile.</p>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      <p className="text-sm text-muted-foreground">
        Update your display name, bio, level, and subjects here.
      </p>

      <ProfileForm user={user} isOnboarding={false} />
    </div>
  );
}
