"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Solution, Problem } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { useDeleteSolution } from "@/hooks/use-problems";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { SaveButton } from "@/components/features/collections/save-button";
import { MathRenderer } from "@/components/ui/math-renderer";
import { toast } from "sonner";
import {
  Video,
  Image as ImageIcon,
  UserCheck,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export interface SolutionItemProps {
  solution: Solution;
  problem: Problem;
  isProblemAuthor?: boolean;
}

export function SolutionItem({ solution, problem }: SolutionItemProps) {
  const { user } = useCurrentUser();
  const deleteMutation = useDeleteSolution();
  const [isExpanded, setIsExpanded] = useState(false);

  const author = solution.author_details;
  const isAuthor = isContentAuthor(user, author, solution.author);
  const score = solution.vote_score ?? solution.vote_count ?? 0;
  const isLowScored = score <= -5;
  const isAuthorSolution = Boolean(solution.is_author_solution);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/problems/${solution.problem}/solutions/${solution.id}`
      : `/problems/${solution.problem}/solutions/${solution.id}`;

  const handleDelete = async () => {
    if (problem.is_locked || solution.is_locked) {
      toast.error("Locked solutions cannot be deleted.");
      return;
    }

    toast.promise(deleteMutation.mutateAsync(solution.id), {
      loading: "Deleting solution...",
      success: "Solution deleted successfully",
      error: (err: unknown) => (err as { message?: string } | undefined)?.message || "Failed to delete solution. Please try again.",
    });
  };

  const router = useRouter();
  const solutionUrl = `/problems/${problem.id}/solutions/${solution.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, [role='button'], [data-prevent-card-nav]")) {
      return;
    }
    router.push(solutionUrl);
  };

  if (isLowScored && !isExpanded) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-medium text-foreground/80">
            {author?.display_name || "Community Solver"}
          </span>
          <ContributorBadge
            tier={author?.contributor_tier ?? author?.reputation?.contributor_tier ?? 0}
            size="sm"
          />
          <span className="font-mono tabular-nums">
            (score: {score})
          </span>
          <span className="hidden sm:inline">· Hidden due to low community score</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <span>Show low-scored solution</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border p-5 transition-all cursor-pointer",
        isLowScored
          ? "border-dashed border-border bg-card/80 opacity-80 hover:opacity-100"
          : "border-border bg-card hover:border-primary/40 hover:shadow-card-hover shadow-card"
      )}
    >
      {isLowScored && isExpanded && (
        <div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs text-muted-foreground">
          <span>Low-scored solution (score: {score})</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="h-6 px-2 text-xs gap-1"
          >
            <span>Collapse</span>
            <ChevronUp className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Main Solution Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Side: Vote Widget + Author & Content */}
        <div className="flex flex-1 items-start gap-4">
          <div className="shrink-0 pt-0.5">
            <VoteWidget
              contentType="solutions"
              contentId={solution.id}
              initialScore={score}
              initialUserVote={solution.user_vote}
              authorId={author?.id || (typeof solution.author === "string" ? solution.author : undefined)}
              authorClerkId={author?.clerk_id}
              problemAuthorId={problem.author}
              problemAuthorClerkId={problem.author_details?.clerk_id}
              variant="stack"
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 min-w-0">
            {/* Author Info & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/users/${author?.id}`} className="flex items-center gap-2 hover:opacity-85">
                <Avatar size="sm">
                  {author?.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                  <AvatarFallback>{getInitials(author?.display_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground">
                  {author?.display_name || "Community Solver"}
                </span>
              </Link>

              <ContributorBadge
                tier={author?.contributor_tier ?? author?.reputation?.contributor_tier ?? 0}
                size="sm"
              />

              <span className="text-xs text-muted-foreground">· {formatDate(solution.created_at)}</span>

              {isAuthorSolution && (
                <Badge
                  variant="outline"
                  className="border-primary/40 text-primary text-[10px] h-5 gap-1"
                  title="Self-solution by problem author"
                >
                  <UserCheck className="size-3" aria-hidden="true" /> Problem Author
                </Badge>
              )}
            </div>

            {/* Compact Line-Clamped Preview Body */}
            <div className="pt-1 text-sm leading-relaxed text-foreground line-clamp-4 overflow-hidden">
              <MathRenderer content={solution.body} />
            </div>

            {/* Compact Media Indicators */}
            {((solution.attachments && solution.attachments.length > 0) || solution.video_url) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {solution.attachments && solution.attachments.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-muted/40 text-[11px] text-muted-foreground">
                    <ImageIcon className="size-3 text-primary" aria-hidden="true" />
                    <span>
                      {solution.attachments.length}{" "}
                      {solution.attachments.length === 1 ? "diagram" : "diagrams"}
                    </span>
                  </span>
                )}
                {solution.video_url && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-muted/40 text-[11px] text-muted-foreground">
                    <Video className="size-3 text-primary" aria-hidden="true" />
                    <span>Video walkthrough</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Save & More Menu */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
          <SaveButton entityType="solution" entityId={solution.id} variant="icon" />

          <CardMoreMenu
            shareUrl={shareUrl}
            contentType="SOLUTION"
            contentId={solution.id}
            author={
              author
                ? {
                    id: author.id,
                    display_name: author.display_name,
                    role: author.role,
                    contributor_tier: author.contributor_tier,
                  }
                : null
            }
            isHidden={solution.is_hidden}
            isLocked={solution.is_locked}
            onDelete={isAuthor && !problem.is_locked && !solution.is_locked ? handleDelete : undefined}
            deleteLabel="this solution"
          />
        </div>
      </div>

      {/* Footer: Comment count and View Full Solution CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          <MessageSquare className="size-3.5 text-primary" aria-hidden="true" />
          <span>
            {solution.comment_count ?? 0}{" "}
            {solution.comment_count === 1 ? "comment" : "comments"}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
          <span>View Full Solution</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
