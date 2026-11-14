"use client";

import { useState, useRef, useEffect } from "react";
import { useVoteProblem } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const voteMutation = useVoteProblem();

  const voterMultiplier =
    user?.dynamic_vote_weight ??
    user?.reputation?.dynamic_vote_weight ??
    (user?.contributor_tier !== undefined ? user.contributor_tier + 1 : 1);

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<number>(initialUserVote ?? 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVoteCount(initialVoteCount);
    setUserVote(initialUserVote ?? 0);
  }, [initialVoteCount, initialUserVote]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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
      toast.info("Please sign in to vote.");
      return;
    }

    if (isSelf) {
      toast.info("You cannot vote on your own question.");
      return;
    }

    const targetValue = userVote === 1 ? 0 : 1;
    const diff = targetValue === 0 ? -(userVote * voterMultiplier) : targetValue * voterMultiplier;

    setUserVote(targetValue);
    setVoteCount((prev) => prev + diff);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate({ problemId, value: targetValue as 1 | 0 });
    }, 400);
  };

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={handleVote}
        disabled={isSelf}
        aria-label={isSelf ? "Cannot vote on your own question" : `Upvote question (${voteCount} votes)`}
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
        <ChevronUp className="size-4 shrink-0" />
        <span className="font-mono tabular-nums text-base font-semibold leading-tight text-foreground">
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
      aria-pressed={userVote === 1}
      title={isSelf ? "You cannot vote on your own question" : "Vote on question"}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
        isSelf ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        userVote === 1 ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
      )}
    >
      <ChevronUp className="size-3.5" />
      <span className="font-mono tabular-nums">{voteCount}</span>
    </button>
  );
}
