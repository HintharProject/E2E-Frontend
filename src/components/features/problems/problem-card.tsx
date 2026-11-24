"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import { Problem } from "@/types";
import { apiFetch } from "@/services/api-client";
import { resolveClientAuth } from "@/lib/client-auth";
import { formatDate } from "@/lib/utils";
import { ProblemCardVote } from "./problem-card-vote";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { useDeleteProblem } from "@/hooks/use-problems";
import { toast } from "sonner";
import { BaseFeedCard } from "@/components/ui/base-card";
import { ArrowRight, BookOpen, ExternalLink, Image as ImageIcon, Lock, MessageSquare } from "lucide-react";
import { SaveButton } from "@/components/features/collections/save-button";
import { ConfidenceBadge } from "./confidence-badge";
import { PostExpirationBadge } from "@/components/features/posts/post-expiration-badge";

export function ProblemCard({ problem }: { problem: Problem }) {
  const { user } = useCurrentUser();
  const { getToken, isSignedIn: isClerkSignedIn } = useAuth();
  const { isAuthed, getOptionalToken } = resolveClientAuth(isClerkSignedIn, getToken);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const deleteMutation = useDeleteProblem();

  const author = problem.author_details;
  const subject = problem.subject_details;
  const level = problem.level_details;
  const isAuthor = isContentAuthor(user, author, problem.author);
  const isLocked = Boolean(problem.is_locked);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/problems/${problem.id}`
    : `/problems/${problem.id}`;

  const handleMouseEnter = () => {
    if (prefetchedRef.current || !isAuthed) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["problem", problem.id, isAuthed ? "auth" : "guest", "v2"],
      queryFn: async () => {
        const token = await getOptionalToken();
        return apiFetch<Problem>(
          `/problems/${problem.id}/?expand=attachments,author_details,subject_details,level_details,resource`,
          token || undefined
        );
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleDelete = async () => {
    if (isLocked) {
      toast.error("Locked problems cannot be deleted by users. Contact staff moderation.");
      return;
    }

    const detailPath = `/problems/${problem.id}`;
    const isDetailRoute = pathname === detailPath || pathname?.startsWith(`${detailPath}/`);

    toast.promise(deleteMutation.mutateAsync(problem.id), {
      loading: "Deleting problem...",
      success: () => {
        if (isDetailRoute) {
          router.push("/problems");
        }
        return "Problem deleted successfully";
      },
      error: (err: unknown) => (err as { message?: string } | undefined)?.message || "Failed to delete problem. Please try again.",
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
  const allTags = problem.tags_data ?? [];
  const displayTags = allTags.slice(0, 2);
  const overflowTagCount = Math.max(0, allTags.length - displayTags.length);
  const syllabusMeta = [subject?.name, level?.name].filter(Boolean).join(" · ");
  const hasTaxonomy = Boolean(displayTags.length > 0 || primaryThumbnailUrl);
  const isExpiringProblem =
    problem.origin !== "PAST_PAPER" &&
    (problem.resolution_confidence ?? 0) < 80 &&
    problem.confidence_band !== "high";

  return (
    <BaseFeedCard
      href={`/problems/${problem.id}`}
      onMouseEnter={handleMouseEnter}
      leftRail={
        <>
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
            title={`${solutionCount} submitted ${solutionCount === 1 ? "solution" : "solutions"}`}
          >
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-semibold text-foreground">
              <MessageSquare className="size-3 text-muted-foreground sm:hidden" aria-hidden="true" />
              {solutionCount}
            </span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:block leading-tight">
              {solutionCount === 1 ? "solution" : "solutions"}
            </span>
          </div>
        </>
      }
      author={
        author
          ? {
              id: author.id,
              display_name: author.display_name,
              profile_image_url: author.profile_image_url,
              contributor_tier: author.contributor_tier ?? author.reputation?.contributor_tier ?? 0,
            }
          : null
      }
      subtitle={
        <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap">
          <span>Asked {formatDate(problem.created_at)}</span>
          {isExpiringProblem && (
            <PostExpirationBadge
              createdAt={problem.created_at}
              entityType="problem"
              showSeparator
            />
          )}
          {syllabusMeta ? <span>· {syllabusMeta}</span> : null}
        </div>
      }
      topRight={
        <>
          <ConfidenceBadge
            confidence={problem.resolution_confidence}
            band={problem.confidence_band}
            size="sm"
          />
          {isLocked && (
            <Badge variant="secondary" className="text-xs gap-1 h-5">
              <Lock className="size-3" aria-hidden="true" /> Locked
            </Badge>
          )}
        </>
      }
      moreMenu={
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
          isHidden={problem.is_hidden}
          isLocked={problem.is_locked}
          onDelete={isAuthor && !isLocked ? handleDelete : undefined}
          deleteLabel="this problem"
        />
      }
      title={problem.title}
      titleAs="h3"
      body={problem.body || ""}
      extraContent={
        problem.origin === "PAST_PAPER" ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border">
            <BookOpen className="size-3.5 text-primary shrink-0" aria-hidden="true" />
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

            {(() => {
              const resId = problem.resource || problem.resource_id || pastPaperDetails?.id;
              if (!resId) return null;
              return (
                <Link
                  href={`/train/${resId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 ml-auto min-h-[44px] sm:min-h-0 px-2 py-1 sm:px-1 sm:py-0 -my-1.5 sm:my-0 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  title="Open this paper in Train practice workspace"
                >
                  <span>Open in Train!</span>
                  <ExternalLink className="size-3" aria-hidden="true" />
                </Link>
              );
            })()}
          </div>
        ) : undefined
      }
      taxonomy={
        hasTaxonomy ? (
          <>
            {displayTags.map((t) => (
              <TagBadge
                key={t.id || t.name}
                name={t.name}
                id={t.id}
                variant="quiet"
              />
            ))}
            {overflowTagCount > 0 && (
              <span
                className="font-mono text-xs tabular-nums text-muted-foreground"
                title={allTags.slice(2).map((t) => `#${t.name}`).join(", ")}
              >
                +{overflowTagCount}
              </span>
            )}
            {primaryThumbnailUrl && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {displayTags.length > 0 && <span aria-hidden="true">·</span>}
                <ImageIcon className="size-3" aria-hidden="true" /> Image
              </span>
            )}
          </>
        ) : undefined
      }
      bottomLeft={
        <Link
          href={`/problems/${problem.id}`}
          className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-0 px-2 -mx-2 sm:px-0 sm:mx-0 text-xs font-semibold text-primary hover:underline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>View problem</span>
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      }
      bottomRight={<SaveButton entityType="problem" entityId={problem.id} variant="icon" />}
    />
  );
}
