"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSolution, useProblem, useDeleteSolution } from "@/hooks/use-problems";
import { useReport } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  UserCheck,
  Lock,
  Video,
  Share2,
  Flag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { LessonMediaViewer } from "@/components/features/lessons/lesson-media-viewer";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { SolutionComments } from "@/components/features/comments/solution-comments";
import { BaseDetailedCard } from "@/components/ui/base-card";
import { SaveButton } from "@/components/features/collections/save-button";
import { StaffContentActionMenu } from "@/components/features/moderation/staff-content-action-menu";
import { MathRenderer } from "@/components/ui/math-renderer";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function SolutionDetailPage({
  params,
}: {
  params: Promise<{ id: string; solutionId: string }>;
}) {
  const { id: problemId, solutionId } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  const { requireAuth } = useAuthGate();

  const { data: solution, isLoading: isSolLoading, isError: isSolError } = useSolution(solutionId);
  const { data: problem } = useProblem(problemId);

  const reportMutation = useReport();
  const deleteMutation = useDeleteSolution();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Solution link copied to clipboard!");
  };

  const handleReport = async () => {
    if (!solution) return;
    if (!requireAuth(undefined, { actionLabel: "report a solution" })) return;
    try {
      await reportMutation.mutateAsync({ targetId: solution.id, targetType: "SOLUTION" });
      toast.success("Solution reported to moderation queue.");
    } catch {
      toast.error("Failed to report. You may have already reported this solution.");
    }
  };

  const handleDelete = async () => {
    if (!solution) return;
    setShowDeleteDialog(false);
    toast.promise(deleteMutation.mutateAsync(solution.id), {
      loading: "Deleting solution...",
      success: () => {
        router.push(`/problems/${problemId}`);
        return "Solution deleted successfully";
      },
      error: (err: unknown) => (err as { message?: string } | undefined)?.message || "Failed to delete solution.",
    });
  };

  if (isSolLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-72 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (isSolError || !solution) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <h2 className="font-heading text-xl font-bold text-foreground">Solution not found</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/problems/${problemId}`)}
        >
          Back to Problem
        </Button>
      </div>
    );
  }

  const author = solution.author_details;
  const isAuthor = isContentAuthor(user, author, solution.author);
  const isLocked = Boolean(solution.is_locked || problem?.is_locked);
  const isAuthorSolution = Boolean(solution.is_author_solution);

  const imageAttachments =
    solution.attachments?.filter((att) => {
      const name =
        att.file_name || att.attachment_name || att.file_url || att.attachment_url || "";
      const ext = name.split("?")[0].split(".").pop()?.toLowerCase() || "";
      return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  const otherAttachments =
    solution.attachments?.filter((att) => {
      const name =
        att.file_name || att.attachment_name || att.file_url || att.attachment_url || "";
      const ext = name.split("?")[0].split(".").pop()?.toLowerCase() || "";
      return !["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb Back Link to Problem */}
      <Link
        href={`/problems/${problemId}`}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        <span>Back to Problem{problem?.title ? `: ${problem.title}` : ""}</span>
      </Link>

      {/* Header */}
      <PageHeader
        title={`Worked Solution`}
        description={`Submitted ${formatDate(solution.created_at)} by ${author?.display_name || "Community Solver"}`}
      />

      {/* Solution Post Card */}
      <BaseDetailedCard
        author={
          author
            ? {
                id: author.id || "",
                display_name: author.display_name || "Community Solver",
                profile_image_url: author.profile_image_url,
                contributor_tier: author.contributor_tier ?? author.reputation?.contributor_tier ?? 0,
              }
            : undefined
        }
        badges={
          <div className="flex flex-wrap items-center gap-1.5">
            {isAuthorSolution && (
              <Badge variant="outline" className="border-primary/40 text-primary text-xs h-5 gap-1">
                <UserCheck className="size-3" aria-hidden="true" /> Problem Author
              </Badge>
            )}
            {isLocked && (
              <Badge variant="secondary" className="text-xs h-5 gap-1">
                <Lock className="size-3" aria-hidden="true" /> Locked
              </Badge>
            )}
          </div>
        }
        body={
          <div className="space-y-4">
            <MathRenderer content={solution.body} />

            {solution.video_url && (
              <div className="pt-2">
                <a
                  href={solution.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-muted/30 text-xs font-medium text-brand hover:border-brand/40"
                >
                  <Video className="size-4" aria-hidden="true" />
                  <span>Watch Video Walkthrough ↗</span>
                </a>
              </div>
            )}
          </div>
        }
        mediaImages={
          imageAttachments.length > 0 ? (
            <LessonMediaViewer imageAttachments={imageAttachments} youtubeUrl={null} />
          ) : undefined
        }
        fileAttachments={
          otherAttachments.length > 0 ? (
            <>
              {otherAttachments.map((att) => (
                <PostAttachment
                  key={att.id}
                  url={att.attachment_url || att.file_url}
                  filename={att.file_name}
                />
              ))}
            </>
          ) : undefined
        }
        interactions={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            {/* Left: VoteWidget & Post Interaction Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <VoteWidget
                contentType="solutions"
                contentId={solution.id}
                initialScore={solution.vote_score ?? solution.vote_count ?? 0}
                initialUserVote={solution.user_vote}
                authorId={author?.id || (typeof solution.author === "string" ? solution.author : undefined)}
                authorClerkId={author?.clerk_id}
                problemAuthorId={problem?.author}
                problemAuthorClerkId={problem?.author_details?.clerk_id}
                variant="pill"
              />

              <SaveButton
                entityType="solution"
                entityId={solution.id}
                variant="ghost"
                size="sm"
                showLabel
                label="Save"
                className="gap-1.5 text-xs text-ink-muted hover:text-ink"
              />

              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-xs text-ink-muted hover:text-ink">
                <Share2 className="size-3.5" aria-hidden="true" />
                <span>Share</span>
              </Button>

              {!isAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReport}
                  disabled={reportMutation.isPending}
                  className="gap-1.5 text-xs text-ink-muted hover:text-destructive"
                >
                  <Flag className="size-3.5" aria-hidden="true" />
                  <span>Report</span>
                </Button>
              )}

              {isAuthor && !isLocked && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-1.5 text-xs text-destructive/80 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </Button>

                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Solution</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this worked solution? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              <StaffContentActionMenu
                targetType="SOLUTION"
                targetId={solution.id}
                targetTitle={`Solution for ${problem?.title || "Problem"}`}
                author={author ? {
                  id: author.id,
                  display_name: author.display_name,
                  email: author.email,
                  role: author.role,
                  contributor_tier: author.contributor_tier,
                  contribution_points: author.contribution_points,
                  ban_status: author.ban_status,
                  ban_expires_at: author.ban_expires_at,
                } : null}
                isHidden={solution.is_hidden}
                isLocked={solution.is_locked}
                isDeleted={solution.is_deleted}
                variant="badge"
                onSuccess={(action) => {
                  if (action === "soft_delete") {
                    router.push(`/problems/${problemId}`);
                  } else {
                    router.refresh();
                  }
                }}
              />
            </div>
          </div>
        }
      />

      {/* Discussion & 2-Level Comments Underneath the Solution */}
      <SolutionComments
        solutionId={solution.id}
        initialCount={solution.comment_count ?? 0}
        isLocked={Boolean(solution.is_locked || problem?.is_locked)}
      />
    </div>
  );
}
