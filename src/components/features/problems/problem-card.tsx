"use client";

import Link from "next/link";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Problem } from "@/types";
import { apiFetch } from "@/services/api-client";
import { formatDate } from "@/lib/utils";
import { ProblemCardVote } from "./problem-card-vote";

import { BaseFeedCard } from "@/components/ui/base-card";


function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export function ProblemCard({ problem }: { problem: Problem }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(false);

  const author = problem.author_details;
  const subject = problem.subject_details;
  const level = problem.level_details;

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
    />
  );
}
