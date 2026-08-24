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
import { toast } from "sonner";

import { BaseFeedCard } from "@/components/ui/base-card";


function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
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
  const isAuthor = user?.id === author?.id;
  const isAdmin = user?.role === "ADMIN";
  const canModify = isAuthor || isAdmin;

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
        return apiFetch<Problem>(`/problems/${problem.id}/`, token);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleDelete = async () => {
    toast.promise(deleteMutation.mutateAsync(problem.id), {
      loading: "Deleting problem...",
      success: () => {
        router.push("/problems");
        return "Problem deleted successfully";
      },
      error: "Failed to delete problem. Please try again.",
    });
  };

  return (
    <BaseFeedCard
      href={`/problems/${problem.id}`}
      onMouseEnter={handleMouseEnter}
      author={author ? {
        id: author.id || "",
        display_name: author.display_name || "Unknown",
        profile_image_url: author.profile_image_url,
      } : undefined}
      subtitle={formatDate(problem.created_at)}
      topRight={
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
      }
      title={problem.title}
      body={problem.body}
      bottomLeft={
        <>
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
        </>
      }
      bottomRight={
        <>
          <ProblemCardVote problemId={problem.id} initialVoteCount={problem.vote_count ?? 0} initialUserVote={problem.user_vote} />
          <span>· {problem.solution_count ?? 0} solutions</span>
        </>
      }
      moreMenu={
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="PROBLEM"
          contentId={problem.id}
          editHref={canModify ? `/problems/${problem.id}/edit` : undefined}
          onDelete={canModify ? handleDelete : undefined}
          deleteLabel="this problem"
        />
      }
    />
  );
}
