"use client";
import { useState, useRef, useEffect } from "react";
import { useVotePost } from "@/hooks/use-interactions";

export function PostCardVote({ postId, initialVoteCount, initialUserVote }: { postId: string; initialVoteCount: number; initialUserVote?: number | null }) {
  const voteMutation = useVotePost();
  
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState(initialUserVote ?? 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to post detail if the card is wrapped in a Link
    e.stopPropagation();

    const targetValue = userVote === 1 ? 0 : 1;
    const diff = targetValue - userVote;
    
    setUserVote(targetValue);
    setVoteCount((prev) => prev + diff);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      voteMutation.mutate({ postId, value: targetValue });
    }, 1000);
  };

  return (
    <button 
      onClick={handleVote}
      className={`flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-50 ${userVote === 1 ? "text-brand" : "text-ink-muted hover:text-brand"}`}
    >
      ▲ {voteCount}
    </button>
  );
}
