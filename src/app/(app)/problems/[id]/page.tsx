"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProblem } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, ExternalLink, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { SolutionPoolContainer } from "@/components/features/problems/solution-pool-container";
import { SolutionFAB } from "@/components/features/problems/solution-fab";
import dynamic from "next/dynamic";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ProblemAuthorActions } from "@/components/features/problems/problem-author-actions";
import { StaffContentActionMenu } from "@/components/features/moderation/staff-content-action-menu";
import { BaseDetailedCard } from "@/components/ui/base-card";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { SaveButton } from "@/components/features/collections/save-button";

const LessonMediaViewer = dynamic(
  () => import("@/components/features/lessons/lesson-media-viewer").then((mod) => mod.LessonMediaViewer),
  {
    loading: () => <div className="aspect-video w-full rounded-xl bg-card border border-line animate-pulse" />,
    ssr: false,
  }
);

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();

  const { data: problem, isLoading: isProblemLoading, isError: isProblemError } = useProblem(id);
  const { useReport } = require("@/hooks/use-interactions");
  const reportMutation = useReport();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleReport = async () => {
    try {
      await reportMutation.mutateAsync({ targetId: id, targetType: "PROBLEM" });
      toast.success("Problem reported to moderation queue.");
    } catch {
      toast.error("Failed to report. You may have already reported this problem.");
    }
  };

  if (isProblemLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-64 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (isProblemError || !problem) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <h2 className="text-xl font-heading font-semibold text-foreground">Problem not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/problems")}>
          Back to Problems
        </Button>
      </div>
    );
  }

  const author = problem.author_details;
  const isAuthor = isContentAuthor(user, author, problem.author);
  const isFinal = problem.status === "FINAL";
  const pastPaperDetails = problem.resource_details;

  const imageAttachments =
    problem.attachments?.filter((att) => {
      const name = att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
      const ext = name.split("?")[0].split(".").pop()?.toLowerCase() || "";
      return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  const otherAttachments =
    problem.attachments?.filter((att) => {
      const name = att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
      const ext = name.split("?")[0].split(".").pop()?.toLowerCase() || "";
      return !["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/problems"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to problems
        </Link>

        <PageHeader
          title={problem.title}
          description={`Asked ${formatDate(problem.created_at)}`}
          actions={
            <div className="flex items-center gap-2">
              {isAuthor && <ProblemAuthorActions problemId={problem.id} isFinal={isFinal} />}
              <StaffContentActionMenu
                targetType="PROBLEM"
                targetId={problem.id}
                targetTitle={problem.title}
                author={problem.author_details}
                isHidden={problem.is_hidden}
                isLocked={problem.is_locked}
                isDeleted={problem.is_deleted}
                isFinal={isFinal}
                variant="button"
              />
            </div>
          }
        />
      </div>

      {/* Path B Past Paper Sourced Ribbon */}
      {problem.origin === "PAST_PAPER" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-foreground font-medium">
            <BookOpen className="size-4 text-primary shrink-0" />
            <span className="font-semibold">{pastPaperDetails?.title || "Curated Exam Paper"}</span>
            {pastPaperDetails?.year && (
              <span className="text-muted-foreground">
                · {pastPaperDetails.year} {pastPaperDetails.session} {pastPaperDetails.paper_type}
              </span>
            )}
            {problem.question_number && (
              <Badge variant="outline" className="text-xs font-bold text-foreground ml-1">
                {problem.question_number}
              </Badge>
            )}
          </div>

          {Boolean(problem.resource || (problem as any).resource_id || pastPaperDetails?.id) && (
            <Link
              href={`/train/${problem.resource || (problem as any).resource_id || pastPaperDetails?.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10"
              title="Open this past paper in Train practice workspace"
            >
              <span>Open in Train!</span>
              <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
      )}

      {/* Problem Detailed Card */}
      <BaseDetailedCard
        author={
          author
            ? {
                id: author.id || "",
                display_name: author.display_name || "Unknown",
                profile_image_url: author.profile_image_url,
                contributor_tier: author.contributor_tier ?? (author as any)?.reputation?.contributor_tier ?? 0,
              }
            : undefined
        }
        badges={
          <div className="flex flex-wrap items-center gap-1.5">
            {problem.status === "FINAL" && (
              <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-medium text-xs gap-1">
                <Lock className="size-3" /> Final Consensus
              </Badge>
            )}
            {problem.status === "SOLVED" && (
              <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs">
                Solved (+10 pts)
              </Badge>
            )}
            {problem.status === "OPEN" && (
              <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5 text-xs">
                Active Pool
              </Badge>
            )}
            {problem.status === "CLOSED" && (
              <Badge variant="secondary" className="text-xs">
                Closed
              </Badge>
            )}

            {problem.subject_details && <Badge variant="outline">{problem.subject_details.name}</Badge>}
            {problem.level_details && <Badge variant="outline">{problem.level_details.name}</Badge>}
            {problem.tags_data?.map((t) => (
              <TagBadge key={t.id || t.name} name={t.name} id={t.id} />
            ))}
          </div>
        }
        body={problem.body}
        mediaImages={
          imageAttachments.length > 0 ? (
            <LessonMediaViewer imageAttachments={imageAttachments} youtubeUrl={null} />
          ) : undefined
        }
        fileAttachments={
          otherAttachments.length > 0 ? (
            <>
              {otherAttachments.map((att) => (
                <PostAttachment key={att.id} url={att.attachment_url || att.file_url} filename={att.file_name} />
              ))}
            </>
          ) : undefined
        }
        interactions={
          <div className="flex flex-wrap items-center gap-2">
            <VoteWidget
              contentType="problems"
              contentId={problem.id}
              initialScore={problem.vote_score ?? problem.vote_count ?? 0}
              initialUserVote={problem.user_vote}
              authorId={author?.id || (typeof problem.author === "string" ? problem.author : undefined)}
              authorClerkId={author?.clerk_id}
              variant="pill"
            />
            <Button variant="ghost" size="sm" onClick={handleShare}>
              Share
            </Button>
            <SaveButton entityType="problem" entityId={problem.id} variant="ghost" size="sm" showLabel label="Save" />
            {user?.clerk_id !== problem.author_details?.clerk_id && (
              <Button variant="ghost" size="sm" onClick={handleReport} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? "Reporting..." : "Report"}
              </Button>
            )}
          </div>
        }
      />

      {/* Solutions Section with 7-Slot Pool & Eviction Engine */}
      <SolutionPoolContainer problem={problem} isAuthor={isAuthor} />

      {/* Floating Action Button for worked solution submission */}
      <SolutionFAB problem={problem} />
    </div>
  );
}
