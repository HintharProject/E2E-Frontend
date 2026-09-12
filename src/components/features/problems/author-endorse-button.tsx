"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { useEndorseSolution } from "@/hooks/use-contribution";

export interface AuthorEndorseButtonProps {
  solutionId: string;
  problemId: string;
  isEndorsed: boolean;
  solutionScore: number;
  problemStatus: string;
  isAuthor: boolean;
  isOwnSolution: boolean;
}

export function AuthorEndorseButton({
  solutionId,
  problemId,
  isEndorsed,
  solutionScore,
  problemStatus,
  isAuthor,
  isOwnSolution,
}: AuthorEndorseButtonProps) {
  const endorseMutation = useEndorseSolution();

  // Only the problem author can endorse candidate community solutions (never their own)
  if (!isAuthor || isOwnSolution) {
    return null;
  }

  // Finalized or closed threads lock author endorsement controls
  if (problemStatus === "FINAL" || problemStatus === "CLOSED") {
    return null;
  }

  // Endorsement requires a positive community score (S > 0)
  const isScoreTooLow = solutionScore <= 0 && !isEndorsed;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isScoreTooLow || endorseMutation.isPending) return;

    endorseMutation.mutate({ solutionId, problemId });
  };

  const tooltipText = isScoreTooLow
    ? "Solutions must have a positive community score (S > 0) to receive author endorsement."
    : isEndorsed
      ? "Click to remove author endorsement"
      : "Endorse this candidate solution (+5 Solved Score accelerator)";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isScoreTooLow || endorseMutation.isPending}
      title={tooltipText}
      className={`text-xs h-7 gap-1.5 transition-all cursor-pointer ${
        isEndorsed
          ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
          : "border-line text-ink-muted hover:text-amber-600 hover:border-amber-400"
      } ${isScoreTooLow ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {endorseMutation.isPending ? (
        <Loader2 className="size-3.5 animate-spin text-ink-muted" />
      ) : isEndorsed ? (
        <>
          <Star className="size-3.5 fill-amber-500 text-amber-500" />
          <span>Endorsed ✓ (Undo)</span>
        </>
      ) : (
        <>
          <Star className="size-3.5" />
          <span>Endorse Solution ★</span>
        </>
      )}
    </Button>
  );
}
