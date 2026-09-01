"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileForm } from "@/components/features/users/profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role === "ADMIN") {
      router.push("/forum");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role === "ADMIN") {
    return null; // Will redirect or not loaded yet
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <PageHeader title="Welcome to E2E!" />
        <p className="mt-2 text-ink-muted">
          Tell us a little bit about yourself to get started. You can always change this later in your profile settings.
        </p>
      </div>

      <ProfileForm user={user} isOnboarding={true} />
    </div>
  );
}
