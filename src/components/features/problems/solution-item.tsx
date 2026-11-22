"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BaseFeedCard } from "@/components/ui/base-card";
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
  const authorId = author?.id;
  const authorName = author?.display_name?.trim() || "Community Solver";
  const isAuthor = isContentAuthor(user, author, solution.author);
  const score = solution.vote_score ?? solution.vote_count ?? 0;
  const isLowScored = score <= -5;
  const isAuthorSolution = Boolean(solution.is_author_solution);
  const problemId = problem.id || solution.problem;
  const solutionUrl = `/problems/${problemId}/solutions/${solution.id}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${solutionUrl}`
      : solutionUrl;
  const formattedDate =
    solution.created_at && !Number.isNaN(Date.parse(solution.created_at))
      ? formatDate(solution.created_at)
      : null;

  const handleDelete = async () => {
    if (problem.is_locked || solution.is_locked) {
      toast.error("Locked solutions cannot be deleted.");
      return;
    }

    toast.promise(deleteMutation.mutateAsync(solution.id), {
      loading: "Deleting solution...",
      success: "Solution deleted successfully",
      error: (err: unknown) =>
        (err as { message?: string } | undefined)?.message ||
        "Failed to delete solution. Please try again.",
    });
  };

  if (isLowScored && !isExpanded) {
    return (
      <article
        aria-label={`Low-scored solution by ${authorName}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-medium text-foreground/80 truncate max-w-[240px] sm:max-w-xs">
            {authorName}
          </span>
          {author ? (
            <ContributorBadge
              tier={author.contributor_tier ?? author.reputation?.contributor_tier ?? 0}
              size="sm"
            />
          ) : null}
          <span className="font-mono tabular-nums">
            (score: {score})
          </span>
          <span className="hidden sm:inline">· Hidden due to low community score</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
        >
          <span>Show low-scored solution</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
      </article>
    );
  }

  const voteCommonProps = {
    contentType: "solutions" as const,
    contentId: solution.id,
    initialScore: score,
    initialUserVote: solution.user_vote,
    authorId: authorId || (typeof solution.author === "string" ? solution.author : undefined),
    authorClerkId: author?.clerk_id,
    problemAuthorId: problem.author,
    problemAuthorClerkId: problem.author_details?.clerk_id,
  };

  return (
    <BaseFeedCard
      className={cn(
        isLowScored && "border-dashed bg-card/80 opacity-80 hover:opacity-100 shadow-none"
      )}
      leftRail={
        <>
          <VoteWidget {...voteCommonProps} variant="pill" size="md" className="sm:hidden" />
          <VoteWidget {...voteCommonProps} variant="stack" className="hidden sm:flex" />
        </>
      }
      leftRailClassName="justify-start sm:justify-center"
      topBanner={
        isLowScored && isExpanded ? (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">Low-scored solution (score: {score})</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 px-2 text-xs gap-1 shrink-0"
            >
              <span>Collapse</span>
              <ChevronUp className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        ) : undefined
      }
      author={
        author
          ? {
              id: author.id,
              display_name: authorName,
              profile_image_url: author.profile_image_url,
              contributor_tier: author.contributor_tier ?? author.reputation?.contributor_tier ?? 0,
            }
          : null
      }
      authorFallbackName={authorName}
      authorBadge={
        isAuthorSolution ? (
          <Badge
            variant="outline"
            className="border-primary/40 text-primary text-xs h-5 gap-1"
            title="Self-solution by problem author"
          >
            <UserCheck className="size-3" aria-hidden="true" /> Problem Author
          </Badge>
        ) : undefined
      }
      subtitle={formattedDate}
      moreMenu={
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
      }
      renderBody={
        <div className="text-sm leading-relaxed text-foreground line-clamp-4 overflow-hidden [overflow-wrap:anywhere]">
          <MathRenderer content={solution.body || ""} />
        </div>
      }
      extraContent={
        (solution.attachments && solution.attachments.length > 0) || solution.video_url ? (
          <div className="flex flex-wrap items-center gap-2">
            {solution.attachments && solution.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground">
                <ImageIcon className="size-3 text-primary" aria-hidden="true" />
                <span>
                  <span className="font-mono tabular-nums">{solution.attachments.length}</span>{" "}
                  {solution.attachments.length === 1 ? "diagram" : "diagrams"}
                </span>
              </span>
            )}
            {solution.video_url && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground">
                <Video className="size-3 text-primary" aria-hidden="true" />
                <span>Video walkthrough</span>
              </span>
            )}
          </div>
        ) : undefined
      }
      bottomLeft={
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          <MessageSquare className="size-3.5 text-primary" aria-hidden="true" />
          <span>
            <span className="font-mono tabular-nums">{solution.comment_count ?? 0}</span>{" "}
            {solution.comment_count === 1 ? "comment" : "comments"}
          </span>
        </div>
      }
      bottomRight={
        <>
          <Link
            href={solutionUrl}
            className="inline-flex items-center gap-1 font-semibold text-primary opacity-90 hover:opacity-100 group-hover:opacity-100 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background after:absolute after:inset-0 after:rounded-xl after:z-0"
          >
            <span>
              View Full Solution<span className="sr-only"> by {authorName}</span>
            </span>
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <div className="relative z-10">
            <SaveButton entityType="solution" entityId={solution.id} variant="icon" />
          </div>
        </>
      }
    />
  );
}
