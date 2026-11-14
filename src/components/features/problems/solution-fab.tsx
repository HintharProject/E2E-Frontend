"use client";

import React, { useState, useMemo } from "react";
import { Problem } from "@/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSolutions } from "@/hooks/use-problems";
import { isWriteLocked } from "@/types/user";
import { CreateSolutionForm } from "./create-solution-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lightbulb, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SolutionFABProps {
  problem: Problem;
  variant?: "inline" | "floating";
}

export function SolutionFAB({ problem, variant = "inline" }: SolutionFABProps) {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);

  // Active pool solutions
  const { data: activeData } = useSolutions(problem.id, true);
  const activeSolutions = useMemo(
    () => activeData?.pages.flatMap((p) => p.data) ?? [],
    [activeData]
  );
  const activeCount = activeSolutions.length;

  const contributorTier = user?.contributor_tier ?? 0;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const canEvict = contributorTier >= 2 || isAdmin;

  const isPoolLocked = useMemo(() => {
    if (activeCount < 7) return false;
    return !activeSolutions.some(
      (s) => !s.is_author_endorsed && !s.is_accepted && (s.vote_score ?? 0) <= 0
    );
  }, [activeCount, activeSolutions]);

  const isClosed = problem.status === "CLOSED";
  const isFinal = problem.status === "FINAL";

  // Hide if write locked or thread finalized/closed
  if (!user || isWriteLocked(user.ban_state) || isClosed || isFinal) {
    return null;
  }

  return (
    <>
      {variant === "inline" ? (
        <Button
          type="button"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 min-h-[40px] sm:min-h-0"
        >
          <PenTool className="size-3.5" />
          <span>Submit Solution</span>
        </Button>
      ) : (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 pointer-events-none flex items-center">
          <div className="relative group flex items-center pointer-events-auto">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Submit a worked solution"
              className="relative flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-card-hover transition-all duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <Lightbulb className="size-4" />
              <span>Submit Solution</span>
            </button>
          </div>
        </div>
      )}

      {/* Solution Submission Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-border bg-card">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-heading font-semibold text-foreground">
                <PenTool className="size-5 text-primary" />
                <span>Submit a Worked Solution</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Contribute step-by-step working, diagrams, and explanation for{" "}
                <span className="font-semibold text-foreground">&ldquo;{problem.title}&rdquo;</span>.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 pt-0">
            <CreateSolutionForm
              problemId={problem.id}
              isSolved={problem.status === "SOLVED"}
              isClosed={isClosed}
              activePoolCount={activeCount}
              canEvict={canEvict}
              isPoolLocked={isPoolLocked}
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
