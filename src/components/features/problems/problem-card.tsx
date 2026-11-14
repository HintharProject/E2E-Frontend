"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import { Problem } from "@/types";
import { apiFetch } from "@/services/api-client";
import { formatDate } from "@/lib/utils";
import { ProblemCardVote } from "./problem-card-vote";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { useDeleteProblem } from "@/hooks/use-problems";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/components/ui/base-card";
import { BookOpen, ExternalLink, Image as ImageIcon, Lock, MessageSquare } from "lucide-react";
import { SaveButton } from "@/components/features/collections/save-button";

function stripProblemPreview(raw: string): string {
  return raw
    .replace(/<[^>]*>?/gm, "")
    .replace(/[#*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ProblemCard({ problem }: { problem: Problem }) {
  const { user } = useCurrentUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const deleteMutation = useDeleteProblem();

  const author = problem.author_details;
  const subject = problem.subject_details;
  const level = problem.level_details;
  const isAuthor = isContentAuthor(user, author, problem.author);
  const isFinal = problem.status === "FINAL";

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/problems/${problem.id}`
    : `/problems/${problem.id}`;

  const handleMouseEnter = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["problem", problem.id],
      queryFn: async () => {
        const token = await getToken();
        if (!token) return problem;
        return apiFetch<Problem>(`/problems/${problem.id}/?expand=attachments,author_details,subject_details,level_details,resource`, token);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleDelete = async () => {
    if (isFinal) {
      toast.error("Finalized problems cannot be deleted by users. Contact staff moderation.");
      return;
    }

    toast.promise(deleteMutation.mutateAsync(problem.id), {
      loading: "Deleting problem...",
      success: () => {
        router.push("/problems");
        return "Problem deleted successfully";
      },
      error: (err: any) => err?.message || "Failed to delete problem. Please try again.",
    });
  };

  // Thumbnail preview for Path A manual photos
  const primaryThumbnailUrl =
    problem.origin === "USER_UPLOAD" && problem.attachments && problem.attachments.length > 0
      ? problem.attachments[0].attachment_url || problem.attachments[0].file_url
      : null;

  // Past Paper Ribbon for Path B
  const pastPaperDetails = problem.resource_details;
  const solutionCount = problem.solution_count ?? 0;
  const displayTags = (problem.tags_data ?? []).slice(0, 3);
  const previewText = stripProblemPreview(problem.body || "");

  return (
    <article
      onMouseEnter={handleMouseEnter}
      className="group relative flex flex-col sm:flex-row rounded-xl border border-border bg-card shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover overflow-hidden"
    >
      {/* Left Status & Vote Rail */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:w-20 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/25 px-4 py-2.5 sm:px-2 sm:py-4">
        <ProblemCardVote
          variant="rail"
          problemId={problem.id}
          initialVoteCount={problem.vote_score ?? problem.vote_count ?? 0}
          initialUserVote={problem.user_vote}
          authorId={author?.id || (typeof problem.author === "string" ? problem.author : undefined)}
          authorClerkId={author?.clerk_id}
        />

        <div
          className="flex sm:flex-col items-center gap-1 sm:gap-0.5 text-center"
          title={`${solutionCount} of 7 active solution pool slots filled`}
        >
          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-semibold text-foreground">
            <MessageSquare className="size-3 text-muted-foreground sm:hidden" />
            {Math.min(solutionCount, 7)}/7
          </span>
          <span className="text-[10px] font-medium text-muted-foreground hidden sm:block">
            {solutionCount === 1 ? "slot" : "slots"}
          </span>
        </div>
      </div>

      {/* Main Challenge Ticket Body */}
      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col gap-3">
        {/* Top Row: Status Pill + Subject/Level + Timestamp + More Menu */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {problem.status === "FINAL" && (
              <Badge variant="outline" className="border-chart-3/40 bg-chart-3/10 text-chart-3 font-medium text-xs gap-1">
                <Lock className="size-3" /> Final Consensus
              </Badge>
            )}
            {problem.status === "SOLVED" && (
              <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs">
                Solved (+10 pts)
              </Badge>
            )}
            {problem.status === "OPEN" && (
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs">
                Active Pool
              </Badge>
            )}
            {problem.status === "CLOSED" && (
              <Badge variant="secondary" className="text-xs">
                Closed
              </Badge>
            )}

            {(subject || level) && (
              <span className="text-xs font-medium text-muted-foreground truncate">
                {[subject?.name, level?.name].filter(Boolean).join(" • ")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">
              Asked {formatDate(problem.created_at)}
            </span>
            <CardMoreMenu
              shareUrl={shareUrl}
              contentType="PROBLEM"
              contentId={problem.id}
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
              isHidden={(problem as any).is_hidden}
              isLocked={(problem as any).is_locked}
              isFinal={problem.status === "FINAL"}
              onDelete={isAuthor ? handleDelete : undefined}
              deleteLabel="this problem"
            />
          </div>
        </div>

        {/* Title + 2-Line Body Preview */}
        <Link
          href={`/problems/${problem.id}`}
          className="block space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <h3 className="font-heading text-lg font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {problem.title}
          </h3>
          {previewText && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {previewText}
            </p>
          )}
        </Link>

        {/* Path B Past Paper Citation Ticket */}
        {problem.origin === "PAST_PAPER" && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border">
            <BookOpen className="size-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground">
              {pastPaperDetails?.title || "Cambridge Past Paper"}
            </span>
            {pastPaperDetails?.year && (
              <span>
                · {pastPaperDetails.year} {pastPaperDetails.session} {pastPaperDetails.paper_type}
              </span>
            )}
            {problem.question_number && (
              <span className="font-mono font-semibold text-foreground">
                · {problem.question_number}
              </span>
            )}

            {Boolean(problem.resource || (problem as any).resource_id || pastPaperDetails?.id) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const resId = problem.resource || (problem as any).resource_id || pastPaperDetails?.id;
                  router.push(`/train/${resId}`);
                }}
                className="inline-flex items-center gap-1 ml-auto text-xs font-semibold text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
                title="Open this paper in Train practice workspace"
              >
                <span>Open in Train!</span>
                <ExternalLink className="size-3" />
              </button>
            )}
          </div>
        )}

        {/* Bottom Metadata Bar: Tags (max 3), Photo Indicator, Author + Tier, Save */}
        <div className="mt-auto pt-1 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {displayTags.map((t) => (
              <TagBadge key={t.id || t.name} name={t.name} id={t.id} />
            ))}
            {primaryThumbnailUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border bg-muted/30 rounded-md px-2 py-0.5">
                <ImageIcon className="size-3" /> Image
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto text-xs text-muted-foreground">
            {author && (
              <Link
                href={`/users/${author.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Avatar size="sm">
                  {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                  <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground truncate max-w-[120px]">
                  {author.display_name || "Unknown"}
                </span>
                <ContributorBadge
                  tier={author.contributor_tier ?? (author as any)?.reputation?.contributor_tier ?? 0}
                  size="sm"
                  showWeightTooltip={false}
                />
              </Link>
            )}
            <SaveButton entityType="problem" entityId={problem.id} variant="icon" />
          </div>
        </div>
      </div>
    </article>
  );
}
