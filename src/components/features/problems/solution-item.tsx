"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Solution } from "@/types";
import { formatDate } from "@/lib/utils";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { useVoteSolution } from "@/hooks/use-problems";
import { useReport } from "@/hooks/use-interactions";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, ChevronRight, CornerLeftUp, Share2, Flag } from "lucide-react";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export function SolutionItem({ solution }: { solution: Solution }) {
  const author = solution.author_details;
  const [isExpanded, setIsExpanded] = useState(false);
  const [localVoteCount, setLocalVoteCount] = useState(solution.vote_count ?? 0);
  const [localUserVote, setLocalUserVote] = useState(solution.user_vote ?? 0);
  
  const voteMutation = useVoteSolution();
  const reportMutation = useReport();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleReport = async () => {
    try {
      await reportMutation.mutateAsync({ targetId: solution.id, targetType: "SOLUTION" });
      toast.success("Solution reported to moderation queue.");
    } catch (err: any) {
      toast.error("Failed to report. You may have already reported this solution.");
    }
  };

  const handleVote = (value: 1 | -1 | 0) => {
    if (localUserVote === value) return;
    const diff = value - localUserVote;
    setLocalUserVote(value);
    setLocalVoteCount((prev) => prev + diff);

    voteMutation.mutate({ solutionId: solution.id, value }, {
      onError: () => {
        // Revert on error
        setLocalUserVote(localUserVote);
        setLocalVoteCount((prev) => prev - diff);
        toast.error("Failed to register vote.");
      }
    });
  };

  if (!isExpanded) {
    return (
      <div 
        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-card p-4 transition-colors hover:border-brand/40 cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center min-w-[40px] gap-1 text-ink-muted">
            <span className="text-sm font-semibold text-ink">{localVoteCount}</span>
            <span className="text-[10px] uppercase tracking-wider">Votes</span>
          </div>
          
          <div className="h-10 w-px bg-line hidden sm:block"></div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {author?.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                <AvatarFallback>{getInitials(author?.display_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-ink">{author?.display_name}</span>
              <span className="text-xs text-ink-muted">· {formatDate(solution.created_at)}</span>
              {solution.status === "WORKED" && (
                <Badge variant="default" className="ml-2 h-5 text-[10px]">Accepted</Badge>
              )}
            </div>
            <p className="line-clamp-1 text-sm text-ink-muted">
              {stripHtml(solution.body)}
            </p>
          </div>
        </div>
        <div className="flex items-center text-brand font-medium text-sm gap-1 group-hover:underline self-end sm:self-center shrink-0">
          View full solution <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Expanded View
  return (
    <div className="flex flex-col rounded-2xl border border-brand/30 bg-card shadow-lg shadow-brand/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Navigation Header */}
      <div 
        className="flex items-center gap-2 px-5 py-3 border-b border-line bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors text-ink-muted hover:text-ink text-sm font-medium"
        onClick={() => setIsExpanded(false)}
      >
        <CornerLeftUp className="w-4 h-4" /> Collapse to preview
      </div>
      
      <div className="flex gap-4 p-5 sm:p-6">
        {/* Voting Sidebar */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button 
            onClick={() => handleVote(localUserVote === 1 ? 0 : 1)}
            className={`p-2 rounded-full transition-colors ${localUserVote === 1 ? 'bg-brand/20 text-brand' : 'hover:bg-muted text-ink-muted hover:text-ink'}`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <span className="font-display text-lg font-bold text-ink">{localVoteCount}</span>
          <button 
            onClick={() => handleVote(localUserVote === -1 ? 0 : -1)}
            className={`p-2 rounded-full transition-colors ${localUserVote === -1 ? 'bg-destructive/20 text-destructive' : 'hover:bg-muted text-ink-muted hover:text-ink'}`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href={`/users/${author?.id}`}>
                <Avatar size="sm">
                  {author?.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                  <AvatarFallback>{getInitials(author?.display_name)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-col">
                <Link href={`/users/${author?.id}`} className="text-sm font-semibold text-ink hover:text-brand-dark">
                  {author?.display_name}
                </Link>
                <span className="text-xs text-ink-muted">Posted {formatDate(solution.created_at)}</span>
              </div>
            </div>
            {solution.status === "WORKED" && (
              <Badge variant="default" className="text-xs font-semibold px-3 py-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                Marked as Working Solution
              </Badge>
            )}
            {solution.status === "INCORRECT" && (
              <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                Marked as Incorrect
              </Badge>
            )}
          </div>
          
          <div className="whitespace-pre-wrap text-sm sm:text-base text-ink leading-relaxed">
            {solution.body}
          </div>

          {solution.attachments && solution.attachments.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Attachments</h4>
              <div className="flex flex-col gap-2">
                {solution.attachments.map(att => (
                  <PostAttachment key={att.id} url={att.file_url} filename={att.file_name} />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-ink-muted hover:text-ink">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReport} 
              disabled={reportMutation.isPending}
              className="text-ink-muted hover:text-danger"
            >
              <Flag className="mr-2 h-4 w-4" /> {reportMutation.isPending ? "Reporting..." : "Report"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
