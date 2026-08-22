"use client";
import { useVotePost } from "@/hooks/use-interactions";

export function PostCardVote({ postId, voteCount }: { postId: string; voteCount: number }) {
  const voteMutation = useVotePost();
  
  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to post detail if the card is wrapped in a Link
    e.stopPropagation();
    voteMutation.mutate({ postId, value: 1 });
  };

  return (
    <button 
      onClick={handleVote}
      disabled={voteMutation.isPending}
      className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-brand transition-colors disabled:opacity-50"
    >
      ▲ {voteCount}
    </button>
  );
}
