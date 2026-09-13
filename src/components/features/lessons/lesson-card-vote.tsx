"use client";
import { useState, useRef, useEffect } from "react";
import { useVoteLesson } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export function LessonCardVote({
  lessonId,
  initialVoteCount,
  initialUserVote,
  authorId,
  authorClerkId,
}: {
  lessonId: string;
  initialVoteCount: number;
  initialUserVote?: number | null;
  authorId?: string;
  authorClerkId?: string;
}) {
  const { user: currentUser } = useCurrentUser();
  const voteMutation = useVoteLesson();

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState(initialUserVote ?? 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents the useEffect prop-sync from overwriting optimistic state
  // while a mutation is in-flight (triggered by onMutate cache patch re-renders)
  const isPendingRef = useRef(false);

  useEffect(() => {
    if (!isPendingRef.current) {
      setVoteCount(initialVoteCount);
      setUserVote(initialUserVote ?? 0);
    }
  }, [initialVoteCount, initialUserVote]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isSelf = Boolean(
    currentUser && (
      (authorId && currentUser.id === authorId) ||
      (authorClerkId && currentUser.clerk_id === authorClerkId)
    )
  );

  const userWeight =
    (currentUser?.contributor_tier !== undefined ? currentUser.contributor_tier + 1 : 1);

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSelf) {
      toast.info("You cannot vote on your own lesson.");
      return;
    }

    const targetValue = userVote === 1 ? 0 : 1;
    const prevVote = userVote;
    const prevCount = voteCount;
    const diff = (targetValue - prevVote) * userWeight;

    setUserVote(targetValue);
    setVoteCount((prev) => prev + diff);

    // Mark pending immediately so onMutate cache patch re-renders won't reset local state
    isPendingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate(
        { lessonId, value: targetValue, voteWeight: userWeight },
        {
          onSettled: () => {
            isPendingRef.current = false;
          },
          onError: () => {
            setUserVote(prevVote);
            setVoteCount(prevCount);
            toast.error("Failed to register vote.");
          },
        }
      );
    }, 1000);
  };

  return (
    <button
      onClick={handleVote}
      disabled={isSelf}
      title={isSelf ? "You cannot vote on your own lesson" : "Upvote"}
      className={`flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isSelf ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${userVote === 1 ? "text-brand font-bold" : "text-ink-muted hover:text-brand"}`}
    >
      ▲ {voteCount}
    </button>
  );
}
