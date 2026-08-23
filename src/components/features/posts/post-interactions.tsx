"use client";
import { useState } from "react";
import { useVotePost, useReport } from "@/hooks/use-interactions";
import { Button } from "@/components/ui/button";
import { Post } from "@/types";
import { SaveToSessionDialog } from "@/components/features/collections/save-to-session-dialog";
import { toast } from "sonner";

export function PostInteractions({ post }: { post: Post }) {
  const voteMutation = useVotePost();
  const reportMutation = useReport();
  
  // Local state for optimistic UI updates in Server Components
  const [voteCount, setVoteCount] = useState(post.vote_count ?? 0);
  const [userVote, setUserVote] = useState(post.user_vote ?? 0);

  const handleVote = (value: 1 | -1 | 0) => {
    // Optimistically update
    if (userVote === value) return; // already voted this way

    const diff = value - userVote;
    setUserVote(value);
    setVoteCount((prev) => prev + diff);

    voteMutation.mutate({ postId: post.id, value });
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
            onClick={() => handleVote(userVote === 1 ? 0 : 1)} 
            disabled={voteMutation.isPending}
          >
            ▲ Upvote ({voteCount})
          </Button>
          <Button 
            variant={userVote === -1 ? "default" : "ghost"} 
            onClick={() => handleVote(userVote === -1 ? 0 : -1)} 
            disabled={voteMutation.isPending}
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
