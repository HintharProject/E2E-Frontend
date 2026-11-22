"use client";
import { useState, useRef, useEffect } from "react";
import { useVotePost } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

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
  const { requireAuth } = useAuthGate();
  const voteMutation = useVotePost();

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState(initialUserVote ?? 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents the useEffect prop-sync from overwriting optimistic state
  // while a mutation is in-flight (triggered by onMutate cache patch re-renders)
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

    if (!currentUser) {
      requireAuth(undefined, { actionLabel: "vote on forum posts" });
      return;
    }

    if (isSelf) {
      toast.info("You cannot vote on your own post.");
      return;
    }

    if (!isPendingRef.current) {
      lastConfirmedRef.current = { voteCount, userVote };
    }

    const targetValue = userVote === 1 ? 0 : 1;
    const diff = (targetValue - userVote) * userWeight;
    const nextCount = voteCount + diff;

    setUserVote(targetValue);
    setVoteCount(nextCount);

    // Mark pending before the debounce fires so the useEffect won't reset state
    // when the onMutate cache patch triggers a re-render
    isPendingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate(
        { postId, value: targetValue, voteWeight: userWeight },
        {
          onSuccess: () => {
            lastConfirmedRef.current = { voteCount: nextCount, userVote: targetValue };
          },
          onSettled: () => {
            isPendingRef.current = false;
          },
          onError: () => {
            // Roll back optimistic state on error
            setUserVote(lastConfirmedRef.current.userVote);
            setVoteCount(lastConfirmedRef.current.voteCount);
            toast.error("Failed to register vote.");
          },
        }
      );
    }, 1000);
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={isSelf}
      aria-label={
        isSelf
          ? "Cannot vote on your own post"
          : userVote === 1
            ? `Remove upvote (${voteCount} votes)`
            : `Upvote post (${voteCount} votes)`
      }
      aria-pressed={userVote === 1}
      title={isSelf ? "You cannot vote on your own post" : "Upvote"}
      className={cn(
        "flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-xs font-semibold transition-colors disabled:opacity-50 rounded-md sm:rounded px-2.5 py-1 sm:px-1.5 sm:py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelf ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        userVote === 1 ? "text-primary bg-primary/10 font-bold" : "text-muted-foreground hover:text-primary"
      )}
    >
      <ChevronUp className="size-3.5" aria-hidden="true" />
      <span className="font-mono tabular-nums">{voteCount}</span>
    </button>
  );
}
