"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Solution, Problem } from "@/types";
import { formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDeleteSolution } from "@/hooks/use-problems";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { AuthorEndorseButton } from "./author-endorse-button";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { toast } from "sonner";
import {
  CheckCircle2,
  Star,
  Video,
  Image as ImageIcon,
  Lock,
  UserCheck,
  Archive,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "");
}

export interface SolutionItemProps {
  solution: Solution;
  problem: Problem;
  isProblemAuthor: boolean;
  isAcceptedHero?: boolean;
  isArchivedAttempt?: boolean;
}

export function SolutionItem({
  solution,
  problem,
  isProblemAuthor = false,
  isAcceptedHero = false,
  isArchivedAttempt = false,
}: SolutionItemProps) {
  const { user } = useCurrentUser();
  const deleteMutation = useDeleteSolution();

  const author = solution.author_details;
  const isAuthor = (user?.id && user.id === author?.id) || (user?.clerk_id && user.clerk_id === author?.clerk_id);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const canModify = isAuthor || isAdmin;

  const isAccepted = solution.is_accepted || solution.status === "WORKED";
  const isAuthorSolution = solution.is_author_solution || (author && (author.id === problem.author || author.clerk_id === problem.author_details?.clerk_id));
  const isEndorsed = solution.is_author_endorsed;
  const isArchived = isArchivedAttempt || solution.is_active_pool === false;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/problems/${solution.problem}/solutions/${solution.id}`
      : `/problems/${solution.problem}/solutions/${solution.id}`;

  const handleDelete = async () => {
    if (problem.status === "FINAL" && isAccepted) {
      toast.error("Accepted solutions on finalized problems cannot be deleted.");
      return;
    }

    toast.promise(deleteMutation.mutateAsync(solution.id), {
      loading: "Deleting solution...",
      success: "Solution deleted successfully",
      error: (err: any) => err?.message || "Failed to delete solution. Please try again.",
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

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col gap-4 rounded-2xl border p-5 transition-all cursor-pointer ${
        isAcceptedHero
          ? "border-emerald-500/60 bg-emerald-500/5 shadow-xs hover:border-emerald-500 hover:shadow-md"
          : isArchived
            ? "border-dashed border-line bg-muted/20 opacity-80 hover:opacity-95 hover:border-line"
            : "border-line bg-card hover:border-brand/60 hover:shadow-md"
      }`}
    >
      {/* Top Banner for Accepted Hero Solution */}
      {isAcceptedHero && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-500/20 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            <span>Accepted Community Solution</span>
          </div>

          <div>
            {problem.status === "FINAL" ? (
              <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-medium text-[11px] gap-1">
                <Lock className="size-3" /> Verified Consensus Finality (Locked)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-[11px]">
                Provisional Acceptance — Peer Review Maturing
              </Badge>
            )}
          </div>
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
              initialScore={solution.vote_score ?? solution.vote_count ?? 0}
              initialUserVote={solution.user_vote}
              authorId={author?.id}
              authorClerkId={author?.clerk_id}
              problemAuthorId={problem.author}
              problemAuthorClerkId={problem.author_details?.clerk_id}
              isActivePool={!isArchived}
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
                <span className="text-sm font-semibold text-ink">{author?.display_name || "Community Solver"}</span>
              </Link>

              {author?.contributor_tier !== undefined && (
                <ContributorBadge tier={author.contributor_tier} size="sm" />
              )}

              <span className="text-xs text-ink-muted">· {formatDate(solution.created_at)}</span>

              {/* Status & Role Badges */}
              {isAuthorSolution && (
                <Badge variant="outline" className="border-brand/40 text-brand text-[10px] h-5 gap-1" title="Self-solution by problem author">
                  <UserCheck className="size-3" /> Problem Author
                </Badge>
              )}

              {isEndorsed && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] h-5 gap-1">
                  <Star className="size-3 fill-amber-500 text-amber-500" /> Author Endorsed ★ (+5)
                </Badge>
              )}

              {isArchived && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Archive className="size-3" /> Archived Attempt
                </Badge>
              )}
            </div>

            {/* Solution Working Content */}
            <div className="text-sm leading-relaxed text-ink whitespace-pre-line break-words pt-1">
              {solution.body}
            </div>

            {/* Video Walkthrough Link */}
            {solution.video_url && (
              <div className="mt-1">
                <a
                  href={solution.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                >
                  <Video className="size-3.5" />
                  <span>Watch Video Walkthrough ↗</span>
                </a>
              </div>
            )}

            {/* Attachments Preview */}
            {solution.attachments && solution.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {solution.attachments.map((att) => {
                  const url = att.attachment_url || att.file_url;
                  return (
                    <a
                      key={att.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-muted/40 text-xs text-ink hover:border-brand/40"
                    >
                      <ImageIcon className="size-3.5 text-brand" />
                      <span className="truncate max-w-[150px]">{att.file_name}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Author Endorse Button & More Menu */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
          <AuthorEndorseButton
            solutionId={solution.id}
            problemId={problem.id}
            isEndorsed={!!isEndorsed}
            solutionScore={solution.vote_score ?? solution.vote_count ?? 0}
            problemStatus={problem.status}
            isAuthor={isProblemAuthor}
            isOwnSolution={!!isAuthor}
          />

          <CardMoreMenu
            shareUrl={shareUrl}
            contentType="SOLUTION"
            contentId={solution.id}
            onDelete={canModify ? handleDelete : undefined}
            deleteLabel="this solution"
          />
        </div>
      </div>

      {/* Footer: Comment count and View Discussion indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5 font-medium text-ink-muted group-hover:text-ink transition-colors">
          <MessageSquare className="size-3.5 text-brand" />
          <span>{solution.comment_count ?? 0} {solution.comment_count === 1 ? "comment" : "comments"}</span>
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-brand opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
          <span>View Discussion</span>
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </div>
  );
}
