"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Solution, Problem } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { useDeleteSolution } from "@/hooks/use-problems";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { AuthorEndorseButton } from "./author-endorse-button";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { SaveButton } from "@/components/features/collections/save-button";
import { MathRenderer } from "@/components/ui/math-renderer";
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
  const isAuthor = isContentAuthor(user, author, solution.author);

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
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border p-5 transition-all cursor-pointer",
        isAcceptedHero
          ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-card hover:border-primary hover:shadow-card-hover"
          : isArchived
            ? "border-dashed border-border bg-muted/20 opacity-80 hover:opacity-95 hover:border-border"
            : "border-border bg-card hover:border-primary/40 hover:shadow-card-hover shadow-card"
      )}
    >
      {/* Top Banner for Accepted Hero Solution with Consensus Checklist */}
      {isAcceptedHero && (
        <div className="flex flex-col gap-2.5 pb-3 border-b border-primary/20 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <CheckCircle2 className="size-4" />
              <span>Accepted Community Consensus (+10 pts)</span>
            </div>

            <div>
              {problem.status === "FINAL" ? (
                <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-medium text-[11px] gap-1">
                  <Lock className="size-3" /> Final Consensus Verified (Locked)
                </Badge>
              ) : (
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[11px]">
                  Provisional Consensus Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Consensus Verification Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-foreground/80 bg-background/60 rounded px-2.5 py-1.5 border border-primary/20">
              <CheckCircle2 className="size-3.5 text-primary shrink-0" />
              <span>Score: <strong>{(solution.vote_score ?? solution.vote_count ?? 0)} pts</strong> (≥10)</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground/80 bg-background/60 rounded px-2.5 py-1.5 border border-primary/20">
              <CheckCircle2 className="size-3.5 text-primary shrink-0" />
              <span>Peer Review: <strong>≥2 Upvoters</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground/80 bg-background/60 rounded px-2.5 py-1.5 border border-primary/20">
              <CheckCircle2 className={cn("size-3.5 shrink-0", isEndorsed ? "text-primary" : "text-muted-foreground")} />
              <span>{isEndorsed ? "Author Endorsed ★" : "Community Verified"}</span>
            </div>
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
              authorId={author?.id || (typeof solution.author === "string" ? solution.author : undefined)}
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
                <span className="text-sm font-semibold text-foreground">{author?.display_name || "Community Solver"}</span>
              </Link>

              <ContributorBadge
                tier={author?.contributor_tier ?? (author as any)?.reputation?.contributor_tier ?? 0}
                size="sm"
              />

              <span className="text-xs text-muted-foreground">· {formatDate(solution.created_at)}</span>

              {/* Status & Role Badges */}
              {isAuthorSolution && (
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px] h-5 gap-1" title="Self-solution by problem author">
                  <UserCheck className="size-3" /> Problem Author
                </Badge>
              )}

              {isEndorsed && (
                <Badge variant="warning" className="text-[11px] h-5 gap-1">
                  <Star className="size-3 fill-current" /> Author Endorsed (+5)
                </Badge>
              )}

              {isArchived && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Archive className="size-3" /> Archived Attempt
                </Badge>
              )}
            </div>

            {/* Solution Working Content */}
            <div className="pt-1 text-sm leading-relaxed text-foreground">
              <MathRenderer content={solution.body} />
            </div>

            {/* Video Walkthrough Link */}
            {solution.video_url && (
              <div className="mt-1">
                <a
                  href={solution.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/40 text-xs text-foreground hover:border-primary/40 transition-colors"
                    >
                      <ImageIcon className="size-3.5 text-primary" />
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

          <SaveButton entityType="solution" entityId={solution.id} variant="icon" />

          <CardMoreMenu
            shareUrl={shareUrl}
            contentType="SOLUTION"
            contentId={solution.id}
            author={author ? {
              id: author.id,
              display_name: author.display_name,
              role: author.role,
              contributor_tier: author.contributor_tier,
            } : null}
            isHidden={(solution as any).is_hidden}
            isLocked={(solution as any).is_locked}
            onDelete={isAuthor ? handleDelete : undefined}
            deleteLabel="this solution"
          />
        </div>
      </div>

      {/* Footer: Comment count and View Discussion indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          <MessageSquare className="size-3.5 text-primary" />
          <span>{solution.comment_count ?? 0} {solution.comment_count === 1 ? "comment" : "comments"}</span>
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
          <span>View Discussion</span>
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </div>
  );
}
