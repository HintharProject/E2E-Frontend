"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Solution } from "@/types";
import { formatDate } from "@/lib/utils";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "");
}

export function ContributionCard({ solution }: { solution: Solution }) {
  const title = solution.problem_title ?? "Solution";
  const href = `/problems/${solution.problem}/solutions/${solution.id}`;

  return (
    <article className="relative pl-6">
      <span className="absolute left-0 top-2 size-2.5 rounded-full bg-primary ring-4 ring-background" />
      <Link
        href={href}
        className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Solution · {formatDate(solution.created_at)}
          </p>
          <Badge
            variant={
              solution.status === "WORKED"
                ? "default"
                : solution.status === "INCORRECT"
                  ? "destructive"
                  : "secondary"
            }
          >
            {solution.status === "WORKED" ? "Accepted" : solution.status}
          </Badge>
        </div>
        <h3 className="mt-2 font-heading text-lg font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {stripHtml(solution.body)}
        </p>
        <div className="mt-3 text-xs font-semibold text-muted-foreground">
          {solution.vote_count ?? 0} votes
        </div>
      </Link>
    </article>
  );
}
