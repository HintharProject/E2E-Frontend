"use client";

import { useState, useRef, useEffect } from "react";
import { useVoteProblem } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

export function ProblemCardVote({
  problemId,
  initialVoteCount,
  initialUserVote,
  authorId,
  authorClerkId,
  variant = "inline",
}: {
  problemId: string;
  initialVoteCount: number;
  initialUserVote?: number | null;
  authorId?: string;
  authorClerkId?: string;
  variant?: "inline" | "rail";
}) {
  const { user } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const voteMutation = useVoteProblem();

  const voterMultiplier =
    user?.dynamic_vote_weight ??
    user?.reputation?.dynamic_vote_weight ??
    (user?.contributor_tier !== undefined ? user.contributor_tier + 1 : 1);

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<number>(initialUserVote ?? 0);
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents the useEffect prop-sync from overwriting optimistic state
  // while a mutation is debounced or in-flight
  const isPendingRef = useRef(false);
  const lastConfirmedRef = useRef({
    voteCount: initialVoteCount,
    userVote: initialUserVote ?? 0,
  });

  useEffect(() => {
    if (!isPendingRef.current) {
      const nextVote = initialUserVote ?? 0;
      setVoteCount(initialVoteCount);
      setUserVote(nextVote);
      lastConfirmedRef.current = { voteCount: initialVoteCount, userVote: nextVote };
    }
  }, [initialVoteCount, initialUserVote]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      isPendingRef.current = false;
    };
  }, []);

  const isSelf = Boolean(
    user && (
      (authorId && user.id === authorId) ||
      (authorClerkId && user.clerk_id === authorClerkId) ||
      (authorId && user.clerk_id === authorId)
    )
  );

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      requireAuth(undefined, { actionLabel: "vote on problems" });
      return;
    }

    if (isSelf) {
      toast.info("You cannot vote on your own question.");
      return;
    }

    if (!isPendingRef.current) {
      lastConfirmedRef.current = { voteCount, userVote };
    }

    const targetValue = userVote === 1 ? 0 : 1;
    const diff = (targetValue - userVote) * voterMultiplier;
    const nextCount = voteCount + diff;

    setUserVote(targetValue);
    setVoteCount(nextCount);

    isPendingRef.current = true;
    setIsPending(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate(
        { problemId, value: targetValue as 1 | 0 },
        {
          onSuccess: () => {
            lastConfirmedRef.current = { voteCount: nextCount, userVote: targetValue };
          },
          onSettled: () => {
            isPendingRef.current = false;
            setIsPending(false);
          },
          onError: () => {
            setUserVote(lastConfirmedRef.current.userVote);
            setVoteCount(lastConfirmedRef.current.voteCount);
            toast.error("Failed to register vote.");
          },
        }
      );
    }, 400);
  };

  const isSyncing = isPending || voteMutation.isPending;

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={handleVote}
        disabled={isSelf}
        aria-busy={isSyncing}
        data-pending={isSyncing ? "true" : undefined}
        aria-label={
          isSelf
            ? "Cannot vote on your own question"
            : userVote === 1
              ? `Remove upvote (${voteCount} votes)`
              : `Upvote question (${voteCount} votes)`
        }
        aria-pressed={userVote === 1}
        title={isSelf ? "You cannot vote on your own question" : "Upvote question"}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg px-2 py-1.5 min-h-[44px] min-w-[44px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSelf ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          userVote === 1
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-transparent bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        <ChevronUp className={cn("size-4 shrink-0", isSyncing && "animate-pulse opacity-80")} aria-hidden="true" />
        <span className={cn("font-mono tabular-nums text-base font-semibold leading-tight text-foreground transition-opacity", isSyncing && "opacity-75")}>
          {voteCount}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={isSelf}
      aria-busy={isSyncing}
      data-pending={isSyncing ? "true" : undefined}
      aria-label={
        isSelf
          ? "Cannot vote on your own question"
          : userVote === 1
            ? `Remove upvote (${voteCount} votes)`
            : `Upvote question (${voteCount} votes)`
      }
      aria-pressed={userVote === 1}
      title={isSelf ? "You cannot vote on your own question" : "Vote on question"}
      className={cn(
        "flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md sm:rounded px-2.5 py-1 sm:px-1.5 sm:py-0.5",
        isSelf ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        userVote === 1 ? "text-primary bg-primary/10 font-bold" : "text-muted-foreground hover:text-primary"
      )}
    >
      <ChevronUp className={cn("size-3.5", isSyncing && "animate-pulse opacity-80")} aria-hidden="true" />
      <span className={cn("font-mono tabular-nums transition-opacity", isSyncing && "opacity-75")}>
        {voteCount}
      </span>
    </button>
  );
}
