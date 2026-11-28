"use client";

import { CreateProblemForm } from "@/components/features/problems/create-problem-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isWriteLocked } from "@/types/user";

export default function NewProblemPage() {
  const { user } = useCurrentUser();
  const writeLocked = user ? isWriteLocked(user.ban_state) : false;

  return (
    <div className="mx-auto max-w-[52rem] space-y-6">
      <h1 className="sr-only">Post a Problem</h1>
      {writeLocked ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm font-medium text-destructive">
          Your account is restricted. You cannot post problems at this time.
        </div>
      ) : (
        <CreateProblemForm />
      )}
    </div>
  );
}
