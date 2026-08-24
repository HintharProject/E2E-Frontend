"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSolution } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { UpdateSolutionForm } from "@/components/features/problems/update-solution-form";
import { isWriteLocked } from "@/types/user";

export default function EditSolutionPage({ params }: { params: Promise<{ id: string; solutionId: string }> }) {
  const { id: problemId, solutionId } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  
  const { data: solution, isLoading, isError } = useSolution(solutionId);

  const writeLocked = user ? isWriteLocked(user.ban_state) : false;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-64 rounded-2xl bg-card border border-line animate-pulse"></div>
      </div>
    );
  }

  if (isError || !solution) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Solution not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/problems/${problemId}`)}>
          Back to Problem
        </Button>
      </div>
    );
  }

  // Only the author can edit, and only if not marked as SOLVED (WORKED)
  if (user?.clerk_id !== solution.author_details?.clerk_id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Unauthorized</h2>
        <p className="mt-2 text-ink-muted">You can only edit your own solutions.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/problems/${problemId}`)}>
          Back to Problem
        </Button>
      </div>
    );
  }

  if (solution.status === "WORKED") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Cannot Edit</h2>
        <p className="mt-2 text-ink-muted">This solution is marked as correct and can no longer be edited.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/problems/${problemId}`)}>
          Back to Problem
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href={`/problems/${problemId}`} className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink mb-6 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to problem
      </Link>

      <PageHeader
        title="Edit Solution"
        description="Update your solution description and attachments."
      />

      <div className="mt-8">
        {writeLocked ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm font-medium text-destructive">
            Your account is restricted. You cannot edit solutions at this time.
          </div>
        ) : (
          <UpdateSolutionForm solution={solution} problemId={problemId} writeLocked={writeLocked} />
        )}
      </div>
    </div>
  );
}
