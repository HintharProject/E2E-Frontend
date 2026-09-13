"use client";
import { useState, useRef, useEffect } from "react";
import { useVotePost, useReport } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Post } from "@/types";
import { SaveToSessionDialog } from "@/components/features/collections/save-to-session-dialog";
import { toast } from "sonner";

export function PostInteractions({ post }: { post: Post }) {
  const { user: currentUser } = useCurrentUser();
  const voteMutation = useVotePost();
  const reportMutation = useReport();

  const author = post.author_details;
  const isAuthor = Boolean(
    currentUser && (
      (post.author && currentUser.id === post.author) ||
      (author?.id && currentUser.id === author.id) ||
      (author?.clerk_id && currentUser.clerk_id === author.clerk_id)
    )
  );

  // Local state for optimistic UI updates
  const [voteCount, setVoteCount] = useState(post.vote_count ?? 0);
  const [userVote, setUserVote] = useState(post.user_vote ?? 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents the useEffect prop-sync from overwriting optimistic state
  // while a mutation is in-flight (triggered by onMutate cache patch re-renders)
  const isPendingRef = useRef(false);

  useEffect(() => {
    if (!isPendingRef.current) {
      setVoteCount(post.vote_count ?? 0);
      setUserVote(post.user_vote ?? 0);
    }
  }, [post.vote_count, post.user_vote]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const userWeight =
    (currentUser?.contributor_tier !== undefined ? currentUser.contributor_tier + 1 : 1);

  const handleVote = (value: 1 | -1 | 0) => {
    if (isAuthor) {
      toast.info("You cannot vote on your own post.");
      return;
    }

    if (userVote === value) return; // already voted this way

    const prevVote = userVote;
    const prevCount = voteCount;
    const diff = (value - prevVote) * userWeight;
    setUserVote(value);
    setVoteCount((prev) => prev + diff);

    // Mark pending immediately so onMutate cache patch re-renders won't reset local state
    isPendingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate(
        { postId: post.id, value, voteWeight: userWeight },
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

  const handleReport = async () => {
    try {
      await reportMutation.mutateAsync({ targetId: post.id, targetType: "POST" });
      toast.success("Post reported to moderation queue.");
    } catch (err: any) {
      toast.error("Failed to report. You may have already reported this post.");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
      {post.post_type !== "ANNOUNCEMENT" ? (
        <>
          <Button
            variant={userVote === 1 ? "default" : "secondary"}
            disabled={isAuthor}
            title={isAuthor ? "You cannot vote on your own post" : "Upvote"}
            className={isAuthor ? "opacity-50 cursor-not-allowed" : ""}
            onClick={() => handleVote(userVote === 1 ? 0 : 1)}
          >
            ▲ Upvote ({voteCount})
          </Button>
          <Button
            variant={userVote === -1 ? "default" : "ghost"}
            disabled={isAuthor}
            title={isAuthor ? "You cannot vote on your own post" : "Downvote"}
            className={isAuthor ? "opacity-50 cursor-not-allowed" : ""}
            onClick={() => handleVote(userVote === -1 ? 0 : -1)}
          >
            ▼ Downvote
          </Button>
        </>
      ) : (
        <span className="text-sm text-ink-muted">
          Voting disabled on announcements
        </span>
      )}
      <SaveToSessionDialog postId={post.id} />
      <Button variant="ghost" onClick={handleShare}>Share</Button>
      <Button variant="ghost" onClick={handleReport} disabled={reportMutation.isPending}>
        {reportMutation.isPending ? "Reporting..." : "Report"}
      </Button>
    </div>
  );
}
