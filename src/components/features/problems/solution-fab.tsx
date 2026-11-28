"use client";

import React, { useState } from "react";
import { Problem } from "@/types";
import { useCurrentUser } from "@/hooks/use-current-user";
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

  const isLocked = Boolean(problem.is_locked);

  // Hide if unauthenticated, write-locked, or thread locked by moderation
  if (!user || isWriteLocked(user.ban_state) || isLocked) {
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
          <PenTool className="size-3.5" aria-hidden="true" />
          <span>Add Solution</span>
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
              <Lightbulb className="size-4" aria-hidden="true" />
              <span>Add Solution</span>
            </button>
          </div>
        </div>
      )}

      {/* Solution Submission Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92dvh] overflow-y-auto p-0 border-border bg-card">
          <div className="border-b border-border/70 px-6 pt-5 pb-3">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
                <PenTool className="size-4 text-primary" aria-hidden="true" />
                <span>Submit a Worked Solution</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Contribute step-by-step working, inline diagrams, and explanation for{" "}
                <span className="font-semibold text-foreground">&ldquo;{problem.title}&rdquo;</span>.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <CreateSolutionForm
              problemId={problem.id}
              isLocked={isLocked}
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
