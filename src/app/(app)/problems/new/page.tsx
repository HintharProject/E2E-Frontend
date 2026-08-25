"use client";

import { CreateProblemForm } from "@/components/features/problems/create-problem-form";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isWriteLocked } from "@/types/user";

export default function NewProblemPage() {
  const { user } = useCurrentUser();
  const writeLocked = user ? isWriteLocked(user.ban_state) : false;
  const isCreator = user?.role === "CREATOR";
  const cannotPost = writeLocked || isCreator;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Post a Problem"
        description="Ask the community for a step-by-step solution."
      />
      <div className="mt-8">
        {cannotPost ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm font-medium text-destructive">
            {isCreator ? "Creators cannot post problems." : "Your account is restricted. You cannot post problems at this time."}
          </div>
        ) : (
          <CreateProblemForm />
        )}
      </div>
    </div>
  );
}
