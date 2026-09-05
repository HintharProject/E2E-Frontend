"use client";

import React, { useState, useEffect, useRef } from "react";
import { useVoteContribution } from "@/hooks/use-contribution";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ContentVoteType } from "@/services/contribution-service";
import { isWriteLocked } from "@/types/user";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export interface VoteWidgetProps {
  contentType: ContentVoteType;
  contentId: string;
  initialScore?: number;
  initialUserVote?: 1 | -1 | 0 | null;
  authorId?: string;
  authorClerkId?: string;
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
  variant = "pill",
  size = "md",
  disabled = false,
  className,
}: VoteWidgetProps) {
  const { user } = useCurrentUser();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | 0>((initialUserVote ?? 0) as 1 | -1 | 0);
  const [floatingFeedback, setFloatingFeedback] = useState<{
    text: string;
    key: number;
    isPositive: boolean;
  } | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setScore(initialScore);
    setUserVote((initialUserVote ?? 0) as 1 | -1 | 0);
  }, [initialScore, initialUserVote]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isSelf = (authorId && user?.id === authorId) || (authorClerkId && user?.clerk_id === authorClerkId);
  const writeLocked = user ? isWriteLocked(user.ban_state) : false;
  const isActionDisabled = disabled || isSelf || writeLocked || !user;

  const voterMultiplier =
    user?.dynamic_vote_weight ??
    user?.reputation?.dynamic_vote_weight ??
    (user?.contributor_tier !== undefined ? user.contributor_tier + 1 : 1);

  const voteMutation = useVoteContribution({
    contentType,
    contentId,
    currentScore: score,
    currentUserVote: userVote,
    onOptimisticChange: (newScore, newVote) => {
      setScore(newScore);
      setUserVote(newVote);
    },
  });

  const handleVote = (e: React.MouseEvent, targetValue: 1 | -1) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Please sign in to vote.");
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

    // Calculate score delta
    let delta = 0;
    if (nextVote === 0) {
      delta = -(userVote * voterMultiplier);
    } else if (userVote === 0) {
      delta = nextVote * voterMultiplier;
    } else {
      delta = (nextVote - userVote) * voterMultiplier;
    }

    const nextScore = score + delta;
    setScore(nextScore);
    setUserVote(nextVote);

    // Trigger floating multiplier micro-feedback
    if (nextVote !== 0) {
      const feedbackText = nextVote === 1 ? `+${voterMultiplier}x Impact` : `-${voterMultiplier}x Impact`;
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
          "relative flex flex-col items-center justify-center rounded-xl border border-line bg-card p-1.5 shadow-xs select-none",
          className
        )}
        title={getDisabledTooltip()}
      >
        {floatingFeedback && (
          <div
            key={floatingFeedback.key}
            className={cn(
              "animate-vote-multiplier pointer-events-none absolute -top-4 font-heading text-xs font-bold tracking-tight whitespace-nowrap z-20",
              floatingFeedback.isPositive ? "text-emerald-500" : "text-rose-500"
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
            "flex size-7 items-center justify-center rounded-lg transition-colors cursor-pointer",
            userVote === 1
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-ink-muted hover:bg-muted hover:text-ink",
            isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <ChevronUp className="size-4" />
        </button>

        {/* Score */}
        <span
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "my-0.5 font-heading text-xs font-semibold tabular-nums",
            userVote === 1 && "text-emerald-600 dark:text-emerald-400",
            userVote === -1 && "text-rose-600 dark:text-rose-400",
            userVote === 0 && "text-ink"
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
            "flex size-7 items-center justify-center rounded-lg transition-colors cursor-pointer",
            userVote === -1
              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
              : "text-ink-muted hover:bg-muted hover:text-ink",
            isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <ChevronDown className="size-4" />
        </button>
      </div>
    );
  }

  // Pill variant (Inline)
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border border-line bg-card shadow-2xs select-none transition-colors",
        size === "sm" && "h-6 px-1 text-[11px]",
        size === "md" && "h-7 px-1.5 text-xs",
        size === "lg" && "h-8 px-2 text-sm",
        className
      )}
      title={getDisabledTooltip()}
    >
      {floatingFeedback && (
        <div
          key={floatingFeedback.key}
          className={cn(
            "animate-vote-multiplier pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 font-heading text-xs font-bold tracking-tight whitespace-nowrap z-20",
            floatingFeedback.isPositive ? "text-emerald-500" : "text-rose-500"
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
          "inline-flex items-center justify-center rounded-full transition-colors cursor-pointer p-0.5",
          userVote === 1
            ? "text-emerald-600 dark:text-emerald-400 font-bold"
            : "text-ink-muted hover:text-emerald-600 hover:bg-emerald-500/10",
          isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        <ChevronUp className="size-3.5" />
      </button>

      {/* Score */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "mx-1 font-heading font-semibold tabular-nums",
          userVote === 1 && "text-emerald-600 dark:text-emerald-400",
          userVote === -1 && "text-rose-600 dark:text-rose-400",
          userVote === 0 && "text-ink"
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
          "inline-flex items-center justify-center rounded-full transition-colors cursor-pointer p-0.5",
          userVote === -1
            ? "text-rose-600 dark:text-rose-400 font-bold"
            : "text-ink-muted hover:text-rose-600 hover:bg-rose-500/10",
          isActionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        <ChevronDown className="size-3.5" />
      </button>
    </div>
  );
}
