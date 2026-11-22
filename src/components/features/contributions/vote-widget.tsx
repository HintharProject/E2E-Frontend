"use client";

import React, { useState, useEffect, useRef } from "react";
import { useVoteContribution } from "@/hooks/use-contribution";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ContentVoteType } from "@/services/contribution-service";
import { isWriteLocked } from "@/types/user";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

export interface VoteWidgetProps {
  contentType: ContentVoteType;
  contentId: string;
  initialScore?: number;
  initialUserVote?: 1 | -1 | 0 | null;
  authorId?: string;
  authorClerkId?: string;
  problemAuthorId?: string;      // For solutions: grants 3x author upvote boost
  problemAuthorClerkId?: string; // Clerk ID support for author boost
  variant?: "stack" | "pill";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function VoteWidget({
  contentType,
  contentId,
  initialScore = 0,
  initialUserVote = 0,
  authorId,
  authorClerkId,
  problemAuthorId,
  problemAuthorClerkId,
  variant = "pill",
  size = "md",
  disabled = false,
  className,
}: VoteWidgetProps) {
  const { user } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | 0>((initialUserVote ?? 0) as 1 | -1 | 0);
  const [prevInitialScore, setPrevInitialScore] = useState(initialScore);
  const [prevInitialUserVote, setPrevInitialUserVote] = useState(initialUserVote);
  const [floatingFeedback, setFloatingFeedback] = useState<{
    text: string;
    key: number;
    isPositive: boolean;
  } | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (initialScore !== prevInitialScore || initialUserVote !== prevInitialUserVote) {
    setPrevInitialScore(initialScore);
    setPrevInitialUserVote(initialUserVote);
    setScore(initialScore);
    setUserVote((initialUserVote ?? 0) as 1 | -1 | 0);
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isSelf = Boolean(
    user && (
      (authorId && user.id === authorId) ||
      (authorClerkId && user.clerk_id === authorClerkId)
    )
  );
  const isProblemAuthor =
    contentType === "solutions" &&
    Boolean(
      (problemAuthorId && user?.id === problemAuthorId) ||
      (problemAuthorClerkId && user?.clerk_id === problemAuthorClerkId)
    );
  const writeLocked = user ? isWriteLocked(user.ban_state) : false;
  const isActionDisabled = disabled || isSelf || writeLocked;

  const voterMultiplier =
    user?.dynamic_vote_weight ??
    user?.reputation?.dynamic_vote_weight ??
    (user?.contributor_tier !== undefined ? user.contributor_tier + 1 : 1);

  const upvoteWeight = isProblemAuthor ? voterMultiplier * 3 : voterMultiplier;
  const downvoteWeight = voterMultiplier;
  const getWeightForVote = (v: 1 | -1 | 0) =>
    v === 1 ? upvoteWeight : v === -1 ? downvoteWeight : 0;

  const voteMutation = useVoteContribution({
    contentType,
    contentId,
    currentScore: score,
    currentUserVote: userVote,
    isProblemAuthor,
    onOptimisticChange: (newScore, newVote) => {
      setScore(newScore);
      setUserVote(newVote);
    },
  });

  const handleVote = (e: React.MouseEvent, targetValue: 1 | -1) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      requireAuth(undefined, { actionLabel: "vote on problems and solutions" });
      return;
    }

    if (isSelf) {
      toast.error("You cannot vote on your own content.");
      return;
    }

    if (writeLocked) {
      toast.error(`Your account is restricted from voting (${user.ban_state}).`);
      return;
    }

    // Toggle unvote if clicking already active vote
    const nextVote: 1 | -1 | 0 = userVote === targetValue ? 0 : targetValue;

    const delta =
      nextVote * getWeightForVote(nextVote) - userVote * getWeightForVote(userVote);

    const nextScore = score + delta;
    setScore(nextScore);
    setUserVote(nextVote);

    // Trigger floating multiplier micro-feedback
    if (nextVote !== 0) {
      const appliedWeight = nextVote === 1 ? upvoteWeight : downvoteWeight;
      const feedbackText =
        nextVote === 1 ? `+${appliedWeight}x Impact` : `-${appliedWeight}x Impact`;
      setFloatingFeedback({
        text: feedbackText,
        key: Date.now(),
        isPositive: nextVote === 1,
      });
    } else {
      setFloatingFeedback(null);
    }

    // Debounce mutation call
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      voteMutation.mutate({ targetValue: nextVote });
    }, 350);
  };

  const getDisabledTooltip = () => {
    if (isSelf) return "You cannot vote on your own content";
    if (writeLocked) return "Account restricted from voting";
    if (!user) return "Sign in to vote";
    return undefined;
  };


  if (variant === "stack") {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-1 md:gap-0 rounded-xl border border-border bg-card p-1.5 shadow-xs select-none",
          className
        )}
        title={getDisabledTooltip()}
      >
        {floatingFeedback && (
          <div
            key={floatingFeedback.key}
            className={cn(
              "animate-vote-multiplier pointer-events-none absolute -top-4 font-heading text-xs font-bold tracking-tight whitespace-nowrap z-20",
              floatingFeedback.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            )}
          >
            {floatingFeedback.text}
          </div>
        )}

        {/* Upvote */}
        <button
          type="button"
          onClick={(e) => handleVote(e, 1)}
          disabled={isActionDisabled}
          aria-label="Upvote"
          aria-pressed={userVote === 1}
          className={cn(
            "flex size-11 md:size-7 items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            userVote === 1
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <ChevronUp className="size-4" aria-hidden="true" />
        </button>

        {/* Score */}
        <span
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "my-0.5 font-mono text-xs font-semibold tabular-nums",
            userVote === 1 && "text-emerald-600 dark:text-emerald-400",
            userVote === -1 && "text-rose-600 dark:text-rose-400",
            userVote === 0 && "text-foreground"
          )}
        >
          {score}
        </span>

        {/* Downvote */}
        <button
          type="button"
          onClick={(e) => handleVote(e, -1)}
          disabled={isActionDisabled}
          aria-label="Downvote"
          aria-pressed={userVote === -1}
          className={cn(
            "flex size-11 md:size-7 items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            userVote === -1
              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  // Pill variant (Inline)
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border border-border bg-card shadow-2xs select-none transition-colors",
        size === "sm" && "min-h-[44px] md:min-h-0 md:h-6 px-1.5 text-xs",
        size === "md" && "min-h-[44px] md:min-h-0 md:h-7 px-1.5 text-xs",
        size === "lg" && "min-h-[44px] md:min-h-0 md:h-8 px-2 text-sm",
        className
      )}
      title={getDisabledTooltip()}
    >
      {floatingFeedback && (
        <div
          key={floatingFeedback.key}
          className={cn(
            "animate-vote-multiplier pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 font-heading text-xs font-bold tracking-tight whitespace-nowrap z-20",
            floatingFeedback.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
          )}
        >
          {floatingFeedback.text}
        </div>
      )}

      {/* Upvote */}
      <button
        type="button"
        onClick={(e) => handleVote(e, 1)}
        disabled={isActionDisabled}
        aria-label="Upvote"
        aria-pressed={userVote === 1}
        className={cn(
          "inline-flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-0.5 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          userVote === 1
            ? "text-emerald-600 dark:text-emerald-400 font-bold"
            : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10",
          isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        <ChevronUp className="size-3.5" aria-hidden="true" />
      </button>

      {/* Score */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "mx-1 font-mono text-xs font-semibold tabular-nums",
          userVote === 1 && "text-emerald-600 dark:text-emerald-400",
          userVote === -1 && "text-rose-600 dark:text-rose-400",
          userVote === 0 && "text-foreground"
        )}
      >
        {score}
      </span>

      {/* Downvote */}
      <button
        type="button"
        onClick={(e) => handleVote(e, -1)}
        disabled={isActionDisabled}
        aria-label="Downvote"
        aria-pressed={userVote === -1}
        className={cn(
          "inline-flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-0.5 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          userVote === -1
            ? "text-rose-600 dark:text-rose-400 font-bold"
            : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10",
          isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
