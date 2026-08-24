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

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

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
    <article
      className="group rounded-2xl border border-line bg-card p-5 transition hover:border-brand/35 hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)] relative"
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`}>
              <Avatar size="sm">
                {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
          <div>
            <Link
              href={`/users/${author?.id}`}
              className="text-sm font-semibold text-ink hover:text-brand-dark"
            >
              {author?.display_name}
            </Link>
            <p className="text-xs text-ink-muted">
              {formatDate(problem.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              problem.status === "SOLVED"
                ? "default" // Highlight solved
                : problem.status === "CLOSED"
                  ? "secondary" // Gray out closed
                  : "outline" // Open is neutral
            }
            className={problem.status === "OPEN" ? "border-brand/50 text-brand bg-brand/10" : ""}
          >
            {problem.status}
          </Badge>
        </div>
      </div>
      <Link href={`/problems/${problem.id}`} className="mt-3 block">
        <h2 className="font-display text-xl text-ink group-hover:text-brand-dark">
          {problem.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {stripHtml(problem.body)}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
        {level ? <Badge variant="outline">{level.name}</Badge> : null}
        
        <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-ink-muted">
          <ProblemCardVote problemId={problem.id} initialVoteCount={problem.vote_count ?? 0} initialUserVote={problem.user_vote} />
          <span>·</span>
          <span>{problem.solution_count ?? 0} solutions</span>
        </div>
      </div>
    </article>
  );
}
