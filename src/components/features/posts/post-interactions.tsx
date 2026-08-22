"use client";
import { useVotePost, useReport } from "@/hooks/use-interactions";
import { Button } from "@/components/ui/button";
import { Post } from "@/types";

export function PostInteractions({ post }: { post: Post }) {
  const voteMutation = useVotePost();
  const reportMutation = useReport();

  const handleVote = (value: 1 | -1 | 0) => {
    voteMutation.mutate({ postId: post.id, value });
  };

  const handleReport = () => {
    reportMutation.mutate({ targetId: post.id, targetType: "POST" });
    alert("Post reported to moderation queue.");
  };

  return (
    <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
      {post.post_type !== "ANNOUNCEMENT" ? (
        <>
          <Button variant="secondary" onClick={() => handleVote(1)} disabled={voteMutation.isPending}>
            ▲ Upvote ({post.vote_count ?? 0})
          </Button>
          <Button variant="ghost" onClick={() => handleVote(-1)} disabled={voteMutation.isPending}>
            ▼ Downvote
          </Button>
        </>
      ) : (
        <span className="text-sm text-ink-muted">
          Voting disabled on announcements
        </span>
      )}
      <Button variant="secondary">Save to session</Button>
      <Button variant="ghost">Share</Button>
      <Button variant="ghost" onClick={handleReport} disabled={reportMutation.isPending}>
        {reportMutation.isPending ? "Reporting..." : "Report"}
      </Button>
    </div>
  );
}
