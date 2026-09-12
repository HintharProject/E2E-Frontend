"use client";

import { useState, useRef, useEffect } from "react";
import { useVoteProblem } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export function ProblemCardVote({
  problemId,
  initialVoteCount,
  initialUserVote,
  authorId,
}: {
  problemId: string;
  initialVoteCount: number;
  initialUserVote?: number | null;
  authorId?: string;
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

  const isSelf = user && authorId && (user.id === authorId || user.clerk_id === authorId);

  const handleVote = (e: React.MouseEvent) => {
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

    const targetValue = userVote === 1 ? 0 : 1;
    const diff = targetValue === 0 ? -(userVote * voterMultiplier) : targetValue * voterMultiplier;

    setUserVote(targetValue);
    setVoteCount((prev) => prev + diff);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate({ problemId, value: targetValue as 1 | 0 });
    }, 400);
  };

  return (
    <button
      onClick={handleVote}
      disabled={!!isSelf}
      title={isSelf ? "You cannot vote on your own question" : "Vote on question"}
      className={`flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer ${
        userVote === 1 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-ink-muted hover:text-brand"
      }`}
    >
      ▲ {voteCount}
    </button>
  );
}
