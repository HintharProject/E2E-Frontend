"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSolution, useProblem, useMarkSolutionStatus, useVoteSolution } from "@/hooks/use-problems";
import { useReport } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { LessonMediaViewer } from "@/components/features/lessons/lesson-media-viewer";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
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
  const voteMutation = useVoteSolution();
  const reportMutation = useReport();

  const [localVoteCount, setLocalVoteCount] = useState(0);
  const [localUserVote, setLocalUserVote] = useState<number>(0);

  useEffect(() => {
    if (solution) {
      setLocalVoteCount(solution.vote_count ?? 0);
      setLocalUserVote(solution.user_vote ?? 0);
    }
  }, [solution]);

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

  const handleVote = (value: 1 | -1 | 0) => {
    if (localUserVote === value || !solution) return;
    const diff = value - localUserVote;
    setLocalUserVote(value);
    setLocalVoteCount((prev) => prev + diff);

    voteMutation.mutate({ solutionId: solution.id, value }, {
      onError: () => {
        setLocalUserVote(localUserVote);
        setLocalVoteCount((prev) => prev - diff);
        toast.error("Failed to register vote.");
      }
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
          <>
            {solution.status === "WORKED" && (
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                Marked as Working Solution
              </Badge>
            )}
            {solution.status === "INCORRECT" && (
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                Marked as Incorrect
              </Badge>
            )}
            {solution.status === "PENDING" && (
              <Badge variant="outline">
                Pending Review
              </Badge>
            )}
          </>
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
          <>
            <Button 
              variant={localUserVote === 1 ? "default" : "secondary"} 
              onClick={() => handleVote(localUserVote === 1 ? 0 : 1)} 
            >
              ▲ Upvote ({localVoteCount})
            </Button>
            <Button 
              variant={localUserVote === -1 ? "default" : "ghost"} 
              onClick={() => handleVote(localUserVote === -1 ? 0 : -1)} 
            >
              ▼ Downvote
            </Button>
            <Button variant="ghost" onClick={handleShare}>Share</Button>
            {user?.clerk_id === author?.clerk_id && solution.status !== "WORKED" && (
              <Button variant="ghost" nativeButton={false} render={<Link href={`/problems/${problemId}/solutions/${solution.id}/edit`} />}>
                Edit
              </Button>
            )}
            {user?.clerk_id !== author?.clerk_id && (
              <Button variant="ghost" onClick={handleReport} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? "Reporting..." : "Report"}
              </Button>
            )}
            {user?.clerk_id === problem?.author_details?.clerk_id && solution.status === "PENDING" && (
              <>
                <Button
                  variant="outline"
                  className="border-green-500/50 text-green-600 hover:bg-green-500/10"
                  disabled={markStatusMutation.isPending}
                  onClick={() => {
                    markStatusMutation.mutate(
                      { solutionId: solution.id, status: "WORKED" },
                      { onSuccess: () => toast.success("Marked as correct solution.") }
                    );
                  }}
                >
                  Mark as Correct
                </Button>
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" className="border-red-500/50 text-red-600 hover:bg-red-500/10" disabled={markStatusMutation.isPending} />}>
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
          </>
        }
      />
    </div>
  );
}
