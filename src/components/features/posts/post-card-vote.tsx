"use client";
import { useState, useRef, useEffect } from "react";
import { useVotePost } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export function PostCardVote({
  postId,
  initialVoteCount,
  initialUserVote,
  authorId,
  authorClerkId,
}: {
  postId: string;
  initialVoteCount: number;
  initialUserVote?: number | null;
  authorId?: string;
  authorClerkId?: string;
}) {
  const { user: currentUser } = useCurrentUser();
  const voteMutation = useVotePost();

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
    e.preventDefault(); // Prevent navigating to post detail if the card is wrapped in a Link
    e.stopPropagation();

    if (isSelf) {
      toast.info("You cannot vote on your own post.");
      return;
    }

    const targetValue = userVote === 1 ? 0 : 1;
    const diff = (targetValue - userVote) * userWeight;

    setUserVote(targetValue);
    setVoteCount((prev) => prev + diff);

    // Mark pending before the debounce fires so the useEffect won't reset state
    // when the onMutate cache patch triggers a re-render
    isPendingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate(
        { postId, value: targetValue, voteWeight: userWeight },
        {
          onSettled: () => {
            isPendingRef.current = false;
          },
          onError: () => {
            // Roll back optimistic state on error
            setUserVote(userVote);
            setVoteCount((prev) => prev - diff);
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
      title={isSelf ? "You cannot vote on your own post" : "Upvote"}
      className={`flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isSelf ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${userVote === 1 ? "text-brand font-bold" : "text-ink-muted hover:text-brand"}`}
    >
      ▲ {voteCount}
    </button>
  );
}
