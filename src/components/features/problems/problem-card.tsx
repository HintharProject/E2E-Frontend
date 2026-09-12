"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Problem } from "@/types";
import { apiFetch } from "@/services/api-client";
import { formatDate } from "@/lib/utils";
import { ProblemCardVote } from "./problem-card-vote";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDeleteProblem } from "@/hooks/use-problems";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { toast } from "sonner";
import { BaseFeedCard } from "@/components/ui/base-card";
import { BookOpen, ExternalLink, Image as ImageIcon } from "lucide-react";

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
  const isAuthor = user?.id === author?.id;
  const isAdmin = user?.role === "ADMIN";
  const canModify = isAuthor || isAdmin;
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

  return (
    <BaseFeedCard
      href={`/problems/${problem.id}`}
      onMouseEnter={handleMouseEnter}
      author={
        author
          ? {
              id: author.id || "",
              display_name: author.display_name || "Unknown",
              profile_image_url: author.profile_image_url,
            }
          : undefined
      }
      subtitle={
        <div className="flex items-center gap-1.5 flex-wrap">
          {author?.contributor_tier !== undefined && (
            <ContributorBadge tier={author.contributor_tier} size="sm" />
          )}
          <span>· Asked {formatDate(problem.created_at)}</span>
        </div>
      }
      topRight={
        <div className="flex items-center gap-1.5">
          {problem.status === "FINAL" && (
            <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-medium text-xs">
              Verified Consensus ✓
            </Badge>
          )}
          {problem.status === "SOLVED" && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium text-xs">
              Solved ✓
            </Badge>
          )}
          {problem.status === "OPEN" && (
            <Badge variant="outline" className="border-brand/50 text-brand bg-brand/10 text-xs">
              Open
            </Badge>
          )}
          {problem.status === "CLOSED" && (
            <Badge variant="secondary" className="text-xs">
              Closed
            </Badge>
          )}
        </div>
      }
      title={problem.title}
      body={problem.body}
      bottomLeft={
        <div className="flex flex-col gap-2 w-full">
          {/* Path B Curated Past Paper Reference Ribbon */}
          {problem.origin === "PAST_PAPER" && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted bg-muted/40 px-2.5 py-1.5 rounded-lg border border-line">
              <BookOpen className="size-3.5 text-brand shrink-0" />
              <span className="font-semibold text-ink">
                {pastPaperDetails?.title || "Cambridge Past Paper"}
              </span>
              {pastPaperDetails?.year && (
                <span>
                  · {pastPaperDetails.year} {pastPaperDetails.session} {pastPaperDetails.paper_type}
                </span>
              )}
              {problem.question_number && (
                <span className="font-bold text-ink">
                  · {problem.question_number}
                </span>
              )}

              {/* Deep Link to Train! */}
              <span
                title="Train! practice mode coming soon"
                className="inline-flex items-center gap-1 ml-auto text-[11px] font-medium text-ink-muted hover:text-ink cursor-default opacity-80"
              >
                <span>Open in Train!</span>
                <ExternalLink className="size-3" />
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
            {level ? <Badge variant="outline">{level.name}</Badge> : null}

            {primaryThumbnailUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted border border-line rounded px-1.5 py-0.5">
                <ImageIcon className="size-3" /> Photo Attached
              </span>
            )}
          </div>
        </div>
      }
      bottomRight={
        <>
          <ProblemCardVote
            problemId={problem.id}
            initialVoteCount={problem.vote_score ?? problem.vote_count ?? 0}
            initialUserVote={problem.user_vote}
            authorId={author?.id}
          />
          <span>· {problem.solution_count ?? 0} {problem.solution_count === 1 ? "solution" : "solutions"}</span>
        </>
      }
      moreMenu={
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="PROBLEM"
          contentId={problem.id}
          onDelete={canModify ? handleDelete : undefined}
          deleteLabel="this problem"
        />
      }
    />
  );
}
