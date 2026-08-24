"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProblem, useSolutions } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { SolutionItem } from "@/components/features/problems/solution-item";
import { CreateSolutionForm } from "@/components/features/problems/create-solution-form";
import { formatDate } from "@/lib/utils";
import { isWriteLocked } from "@/types/user";
import { useVoteProblem } from "@/hooks/use-problems";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Virtuoso } from "react-virtuoso";
import { ProblemAuthorActions } from "@/components/features/problems/problem-author-actions";
import { BaseDetailedCard } from "@/components/ui/base-card";
import { LessonMediaViewer } from "@/components/features/lessons/lesson-media-viewer";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function ProblemActions({ problemId, isAuthor }: { problemId: string; isAuthor: boolean }) {
  return (
    <div className="flex gap-2">
      {isAuthor && <ProblemAuthorActions problemId={problemId} />}
    </div>
  );
}

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  
  const { data: problem, isLoading: isProblemLoading, isError: isProblemError } = useProblem(id);
  const { 
    data: solutionsData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isSolutionsLoading 
  } = useSolutions(id);

  const [localVoteCount, setLocalVoteCount] = useState(0);
  const [localUserVote, setLocalUserVote] = useState<number>(0);
  const voteMutation = useVoteProblem();
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
    } catch (err: any) {
      toast.error("Failed to report. You may have already reported this problem.");
    }
  };

  useEffect(() => {
    if (problem) {
      setLocalVoteCount(problem.vote_count ?? 0);
      setLocalUserVote(problem.user_vote ?? 0);
    }
  }, [problem]);

  const handleVote = (value: 1 | -1 | 0) => {
    if (localUserVote === value || !problem) return;
    const diff = value - localUserVote;
    setLocalUserVote(value);
    setLocalVoteCount((prev) => prev + diff);

    voteMutation.mutate({ problemId: problem.id, value }, {
      onError: () => {
        setLocalUserVote(localUserVote);
        setLocalVoteCount((prev) => prev - diff);
        toast.error("Failed to register vote.");
      }
    });
  };

  const writeLocked = user ? isWriteLocked(user.ban_state) : false;

  if (isProblemLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-64 rounded-2xl bg-card border border-line animate-pulse"></div>
      </div>
    );
  }

  if (isProblemError || !problem) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Problem not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/problems")}>
          Back to Problems
        </Button>
      </div>
    );
  }

  const author = problem.author_details;
  
  const imageAttachments = problem.attachments?.filter(att => {
    const name = att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
    const ext = name.split('?')[0].split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  }) || [];
  
  const otherAttachments = problem.attachments?.filter(att => {
    const name = att.file_name || (att as any).attachment_name || att.file_url || (att as any).attachment_url || "";
    const ext = name.split('?')[0].split('.').pop()?.toLowerCase() || '';
    return !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  }) || [];

  const solutions = solutionsData?.pages.flatMap(p => p.data) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/problems" className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink mb-6 transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to problems
      </Link>

      <PageHeader
        title={problem.title}
        description={`Asked ${formatDate(problem.created_at)}`}
        actions={<ProblemActions problemId={problem.id} isAuthor={user?.clerk_id === problem.author_details?.clerk_id} />}
      />

      {/* Problem Section */}
      <BaseDetailedCard
        author={author ? {
          id: author.id || "",
          display_name: author.display_name || "Unknown",
          profile_image_url: author.profile_image_url,
        } : undefined}
        badges={
          <>
            <Badge
              variant={
                problem.status === "SOLVED"
                  ? "default"
                  : problem.status === "CLOSED"
                    ? "secondary"
                    : "outline"
              }
              className={problem.status === "OPEN" ? "border-brand/50 text-brand bg-brand/10" : ""}
            >
              {problem.status}
            </Badge>
            {problem.subject_details && <Badge variant="outline">{problem.subject_details.name}</Badge>}
            {problem.level_details && <Badge variant="outline">{problem.level_details.name}</Badge>}
          </>
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
            {user?.clerk_id !== problem.author_details?.clerk_id && (
              <Button variant="ghost" onClick={handleReport} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? "Reporting..." : "Report"}
              </Button>
            )}
          </>
        }
      />

      {/* Solutions Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {problem.solution_count ?? 0} {problem.solution_count === 1 ? 'Solution' : 'Solutions'}
          </h2>
        </div>

        {isSolutionsLoading ? (
          <div className="space-y-4">
            <div className="h-24 rounded-xl bg-card border border-line animate-pulse"></div>
            <div className="h-24 rounded-xl bg-card border border-line animate-pulse"></div>
          </div>
        ) : solutions.length > 0 ? (
          <div className="flex flex-col gap-4 mb-8">
            {solutions.map((solution) => (
              <SolutionItem key={solution.id} solution={solution} isProblemAuthor={user?.clerk_id === problem.author_details?.clerk_id} />
            ))}
            {hasNextPage && (
              <Button 
                variant="outline" 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="w-full"
              >
                {isFetchingNextPage ? "Loading more..." : "Load more solutions"}
              </Button>
            )}
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-dashed border-line bg-card/50 p-8 text-center text-ink-muted">
            No solutions yet. Be the first to help out!
          </div>
        )}

        {/* Create Solution Form */}
        {!writeLocked && user?.clerk_id !== problem.author_details?.clerk_id && (
          <div className="mt-8 pt-8 border-t border-line">
            <CreateSolutionForm problemId={problem.id} isSolved={problem.status === "SOLVED"} />
          </div>
        )}
      </div>
    </div>
  );
}
