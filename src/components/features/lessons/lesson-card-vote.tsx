"use client";
import { useState, useRef, useEffect } from "react";
import { useVoteLesson } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

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
  const { requireAuth } = useAuthGate();
  const voteMutation = useVoteLesson();

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState(initialUserVote ?? 0);
  const [isPending, setIsPending] = useState(false);
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
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      requireAuth(undefined, { actionLabel: "vote on lessons" });
      return;
    }

    if (isSelf) {
      toast.info("You cannot vote on your own lesson.");
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

    // Mark pending immediately so onMutate cache patch re-renders won't reset local state
    isPendingRef.current = true;
    setIsPending(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate(
        { lessonId, value: targetValue, voteWeight: userWeight },
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
    }, 350);
  };

  const isSyncing = isPending || voteMutation.isPending;

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={isSelf}
      aria-busy={isSyncing}
      data-pending={isSyncing ? "true" : undefined}
      aria-label={
        isSelf
          ? "Cannot vote on your own lesson"
          : userVote === 1
            ? `Remove upvote (${voteCount} votes)`
            : `Upvote lesson (${voteCount} votes)`
      }
      aria-pressed={userVote === 1}
      title={isSelf ? "You cannot vote on your own lesson" : "Upvote"}
      className={cn(
        "flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-xs font-semibold transition-colors disabled:opacity-50 rounded-md sm:rounded px-2.5 py-1 sm:px-1.5 sm:py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
