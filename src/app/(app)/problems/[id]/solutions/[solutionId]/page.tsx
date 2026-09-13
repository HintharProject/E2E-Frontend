"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSolution, useProblem, useDeleteSolution } from "@/hooks/use-problems";
import { useReport } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  CheckCircle2,
  Star,
  UserCheck,
  Archive,
  Video,
  Share2,
  Flag,
  Edit2,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { LessonMediaViewer } from "@/components/features/lessons/lesson-media-viewer";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { AuthorEndorseButton } from "@/components/features/problems/author-endorse-button";
import { SolutionComments } from "@/components/features/comments/solution-comments";
import { BaseDetailedCard } from "@/components/ui/base-card";
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
      error: (err: any) => err?.message || "Failed to delete solution.",
    });
  };

  if (isSolLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-72 rounded-2xl bg-card border border-line animate-pulse" />
      </div>
    );
  }

  if (isSolError || !solution) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Solution not found</h2>
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
  const isAuthor =
    (user?.id && user.id === author?.id) ||
    (user?.clerk_id && user.clerk_id === author?.clerk_id);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const canModify = isAuthor || isAdmin;

  const isProblemAuthor =
    Boolean(
      (user?.id && problem?.author && user.id === problem.author) ||
      (user?.clerk_id && problem?.author_details?.clerk_id && user.clerk_id === problem.author_details.clerk_id)
    );

  const isAccepted = solution.is_accepted || solution.status === "WORKED";
  const isAuthorSolution =
    solution.is_author_solution ||
    (author && problem && (author.id === problem.author || author.clerk_id === problem.author_details?.clerk_id));
  const isEndorsed = solution.is_author_endorsed;
  const isArchived = solution.is_active_pool === false;

  const imageAttachments =
    solution.attachments?.filter((att) => {
      const name =
        att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
      const ext = name.split("?")[0].split(".").pop()?.toLowerCase() || "";
      return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  const otherAttachments =
    solution.attachments?.filter((att) => {
      const name =
        att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
      const ext = name.split("?")[0].split(".").pop()?.toLowerCase() || "";
      return !["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Breadcrumb Back Link to Problem */}
      <Link
        href={`/problems/${problemId}`}
        className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink mb-6 transition-colors"
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
              }
            : undefined
        }
        badges={
          <div className="flex flex-wrap items-center gap-1.5">
            {author?.contributor_tier !== undefined && (
              <ContributorBadge tier={author.contributor_tier} size="sm" />
            )}

            {isAccepted && (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[10px]">
                <CheckCircle2 className="size-3" /> Accepted Solution
              </Badge>
            )}

            {isAuthorSolution && (
              <Badge variant="outline" className="border-brand/40 text-brand text-[10px] h-5 gap-1">
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
        }
        body={
          <div className="space-y-4">
            <div className="whitespace-pre-line leading-relaxed text-ink break-words">
              {solution.body}
            </div>

            {solution.video_url && (
              <div className="pt-2">
                <a
                  href={solution.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-muted/30 text-xs font-medium text-brand hover:border-brand/40"
                >
                  <Video className="size-4" />
                  <span>Watch Video Walkthrough ↗</span>
                </a>
              </div>
            )}
          </div>
        }
        mediaImages={
          imageAttachments.length > 0 ? (
            <LessonMediaViewer imageAttachments={imageAttachments as any} youtubeUrl={null} />
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
                isActivePool={!isArchived}
                variant="pill"
              />

              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-xs text-ink-muted hover:text-ink">
                <Share2 className="size-3.5" />
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
                  <Flag className="size-3.5" />
                  <span>Report</span>
                </Button>
              )}

              {isAuthor && !isAccepted && problem?.status !== "FINAL" && (
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/problems/${problemId}/solutions/${solution.id}/edit`} />}
                  className="gap-1.5 text-xs text-ink-muted hover:text-ink"
                >
                  <Edit2 className="size-3.5" />
                  <span>Edit</span>
                </Button>
              )}

              {canModify && (
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
            </div>

            {/* Right: Problem Author Endorsement */}
            {problem && (
              <div className="shrink-0">
                <AuthorEndorseButton
                  solutionId={solution.id}
                  problemId={problem.id}
                  isEndorsed={!!isEndorsed}
                  solutionScore={solution.vote_score ?? solution.vote_count ?? 0}
                  problemStatus={problem.status}
                  isAuthor={isProblemAuthor}
                  isOwnSolution={!!isAuthor}
                />
              </div>
            )}
          </div>
        }
      />

      {/* Discussion & 2-Level Comments Underneath the Solution */}
      <SolutionComments solutionId={solution.id} initialCount={solution.comment_count ?? 0} />
    </div>
  );
}
