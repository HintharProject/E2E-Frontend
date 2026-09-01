"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { GraduationForm } from "@/components/features/users/graduation-form";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";

export default function GraduationPage() {
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-ink-muted">Please log in.</p>
      </div>
    );
  }

  if (user.role === "STUDENT") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-ink-muted">
          You are currently a Student. To graduate, you must create a new Senior Student account and link your old account here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <PageHeader title="Graduate to Senior Student" />
        <p className="mt-2 text-ink-muted">
          Connect your old Student account to carry over your historical data (votes, activity).
        </p>
      </div>

      <GraduationForm />
    </div>
  );
}
