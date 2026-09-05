"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSolution, useProblem, useMarkSolutionStatus } from "@/hooks/use-problems";
import { useReport } from "@/hooks/use-interactions";
import { useAcceptSolution } from "@/hooks/use-contribution";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { LessonMediaViewer } from "@/components/features/lessons/lesson-media-viewer";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { VoteWidget } from "@/components/features/contributions/vote-widget";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { BaseDetailedCard } from "@/components/ui/base-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export default function SolutionDetailPage({ params }: { params: Promise<{ id: string; solutionId: string }> }) {
  const { id: problemId, solutionId } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  
  const { data: solution, isLoading, isError } = useSolution(solutionId);
  const { data: problem } = useProblem(problemId);
  
  const markStatusMutation = useMarkSolutionStatus();
  const acceptMutation = useAcceptSolution();
  const reportMutation = useReport();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleReport = async () => {
    if (!solution) return;
    try {
      await reportMutation.mutateAsync({ targetId: solution.id, targetType: "SOLUTION" });
      toast.success("Solution reported to moderation queue.");
    } catch (err: any) {
      toast.error("Failed to report. You may have already reported this solution.");
    }
  };

  const handleToggleAccept = (action: "accept" | "unaccept") => {
    acceptMutation.mutate({
      problemId,
      solutionId,
      action,
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-64 rounded-2xl bg-card border border-line animate-pulse"></div>
      </div>
    );
  }

  if (isError || !solution) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Solution not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/problems/${problemId}`)}>
          Back to Problem
        </Button>
      </div>
    );
  }

  const author = solution.author_details;
  const isProblemAuthor = user?.clerk_id === problem?.author_details?.clerk_id;
  const isAccepted = solution.status === "WORKED";

  const imageAttachments = solution.attachments?.filter(att => {
    const name = att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
    const ext = name.split('?')[0].split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  }) || [];
  
  const otherAttachments = solution.attachments?.filter(att => {
    const name = att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
    const ext = name.split('?')[0].split('.').pop()?.toLowerCase() || '';
    return !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  }) || [];
  
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href={`/problems/${problemId}`} className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink mb-6 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to original problem
      </Link>

      <PageHeader
        title="Solution Detail"
        description={`Posted ${formatDate(solution.created_at)}`}
      />

      <BaseDetailedCard
        author={author ? {
          id: author.id || "",
          display_name: author.display_name || "Unknown",
          profile_image_url: author.profile_image_url,
        } : undefined}
        badges={
          <div className="flex flex-wrap items-center gap-1.5">
            <ContributorBadge tier={author?.contributor_tier} size="sm" />
            {isAccepted && (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[10px]">
                <CheckCircle2 className="size-3" /> Accepted Solution
              </Badge>
            )}
            {solution.status === "INCORRECT" && (
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 text-[10px]">
                Marked as Incorrect
              </Badge>
            )}
            {solution.status === "PENDING" && (
              <Badge variant="outline" className="text-[10px]">
                Pending Review
              </Badge>
            )}
          </div>
        }
        body={solution.body}
        mediaImages={
          imageAttachments.length > 0 ? (
            <LessonMediaViewer imageAttachments={imageAttachments as any} youtubeUrl={null} />
          ) : undefined
        }
        fileAttachments={
          otherAttachments.length > 0 ? (
            <>
              {otherAttachments.map(att => (
                <PostAttachment key={att.id} url={att.attachment_url || att.file_url} filename={att.file_name} />
              ))}
            </>
          ) : undefined
        }
        interactions={
          <div className="flex flex-wrap items-center gap-2">
            <VoteWidget
              contentType="solutions"
              contentId={solution.id}
              initialScore={solution.vote_score ?? solution.vote_count ?? 0}
              initialUserVote={solution.user_vote}
              authorId={author?.id}
              authorClerkId={author?.clerk_id}
              variant="pill"
            />
            <Button variant="ghost" size="sm" onClick={handleShare}>Share</Button>
            {user?.clerk_id === author?.clerk_id && !isAccepted && (
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/problems/${problemId}/solutions/${solution.id}/edit`} />}>
                Edit
              </Button>
            )}
            {user?.clerk_id !== author?.clerk_id && (
              <Button variant="ghost" size="sm" onClick={handleReport} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? "Reporting..." : "Report"}
              </Button>
            )}

            {/* Problem Author Accept / Unaccept Actions */}
            {isProblemAuthor && (
              <div className="ml-auto flex items-center gap-2">
                {isAccepted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAccept("unaccept")}
                    disabled={acceptMutation.isPending}
                    className="text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <Check className="size-3.5 mr-1" /> Accepted (Undo)
                  </Button>
                ) : (
                  <>
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button
                            variant="default"
                            size="sm"
                            disabled={acceptMutation.isPending}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="size-3.5 mr-1" /> Accept Solution (+10 pts)
                          </Button>
                        }
                      />
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-emerald-500" />
                            Accept {author?.display_name || "this user"}&apos;s Solution?
                          </DialogTitle>
                          <DialogDescription>
                            Accepting this solution will mark this problem as <strong>SOLVED</strong> and reward <strong>+10 milestone points</strong> to you.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                          <DialogClose
                            render={
                              <Button
                                variant="default"
                                onClick={() => handleToggleAccept("accept")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              />
                            }
                          >
                            Confirm Acceptance
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger render={<Button variant="outline" size="sm" className="text-xs border-red-500/50 text-red-600 hover:bg-red-500/10" disabled={markStatusMutation.isPending} />}>
                        Mark as Incorrect
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mark as Incorrect</DialogTitle>
                          <DialogDescription>
                            Are you sure? This will mark it as incorrect and auto-delete it.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                          <DialogClose render={
                            <Button
                              variant="destructive"
                              onClick={() => {
                                markStatusMutation.mutate(
                                  { solutionId: solution.id, status: "INCORRECT" },
                                  { onSuccess: () => { toast.success("Marked as incorrect."); router.push(`/problems/${problemId}`); } }
                                );
                              }}
                            />
                          }>
                            Confirm
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
