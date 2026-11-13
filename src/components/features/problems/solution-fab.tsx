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
import { Lightbulb, PenTool, Sparkles } from "lucide-react";

export interface SolutionFABProps {
  problem: Problem;
}

export function SolutionFAB({ problem }: SolutionFABProps) {
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
      {/* Floating Action Bubble: positioned cleanly above MobileBottomNav on mobile and bottom-right on desktop */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 pointer-events-none flex items-center">
        <div className="relative group flex items-center pointer-events-auto">
          {/* Tooltip badge on hover */}
          <span className="mr-3 hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-foreground bg-card/95 border border-border shadow-card backdrop-blur-xs opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none select-none whitespace-nowrap">
            <Sparkles className="size-3 text-amber-500" />
            <span>Submit Solution</span>
          </span>

          {/* Bubble Button with solver logo */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Submit a worked solution"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card-hover transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-modal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
          >
            <Lightbulb className="h-6 w-6 stroke-[2.2]" />

            {/* Glowing pulse indicator for open problems */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-background" />
            </span>
          </button>
        </div>
      </div>

      {/* Solution Submission Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-border bg-card">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-display font-semibold text-ink">
                <PenTool className="size-5 text-brand" />
                <span>Submit a Worked Solution</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-muted">
                Contribute step-by-step working, diagrams, and explanation for{" "}
                <span className="font-semibold text-ink">&ldquo;{problem.title}&rdquo;</span>.
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
