"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Problem, SolutionSortMode } from "@/types";
import { useSolutions } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SolutionItem } from "./solution-item";
import { SolutionFAB } from "./solution-fab";
import { ConfidenceBadge } from "./confidence-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Layers, Lock, LogIn, UserPlus, ArrowRight, Award, Clock } from "lucide-react";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

export interface SolutionListContainerProps {
  problem: Problem;
  isAuthor: boolean;
}

export function SolutionListContainer({ problem, isAuthor }: SolutionListContainerProps) {
  const { user } = useCurrentUser();
  const { isSignedIn, isLoaded, openAuthGate } = useAuthGate();
  const [sort, setSort] = useState<SolutionSortMode>("score");

  const hasMemberAccess = Boolean(isSignedIn || user);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSolutions(problem.id, sort, hasMemberAccess);

  const solutions = useMemo(() => {
    return data?.pages.flatMap((p) => p.data) ?? [];
  }, [data]);

  const totalCount = problem.solution_count ?? solutions.length;
  const encodedRedirect = encodeURIComponent(`/problems/${problem.id}`);

  if (!isLoaded && !hasMemberAccess) {
    return (
      <section aria-label="Loading solutions" className="space-y-6">
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-heading text-2xl font-semibold text-foreground tracking-tight">
                Solutions ({totalCount})
              </h2>
            </div>
            <div className="h-7 w-32 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-44 rounded-xl border border-border bg-card animate-pulse" />
      </section>
    );
  }

  if (isLoaded && !hasMemberAccess) {
    return (
      <section aria-label="Solutions gated preview" className="space-y-6">
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-heading text-2xl font-semibold text-foreground tracking-tight">
                Solutions ({totalCount})
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <ConfidenceBadge
                confidence={problem.resolution_confidence}
                band={problem.confidence_band}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  openAuthGate({
                    actionLabel: "submit a worked solution",
                    redirectUrl: `/problems/${problem.id}`,
                  })
                }
                className="gap-1.5 text-xs font-semibold"
              >
                <Lock className="size-3.5" aria-hidden="true" />
                <span>Add Solution</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-card text-center space-y-4">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Lock className="size-5" aria-hidden="true" />
          </div>
          <div className="mx-auto max-w-md space-y-1.5">
            <h3 className="font-heading text-lg font-semibold text-foreground tracking-tight">
              Sign up or log in to inspect peer solutions
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {totalCount > 0
                ? `${totalCount} worked ${totalCount === 1 ? "solution has" : "solutions have"} been submitted to this problem.`
                : "Be the first to contribute a worked step-by-step solution once signed in."}{" "}
              Create a free E2E account to read solutions, see confidence validation, vote, and contribute.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Link
              href={`/sign-up?redirect_url=${encodedRedirect}`}
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "min-h-[44px] md:min-h-[38px] px-4 gap-1.5 font-semibold",
              })}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              <span>Sign up free</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Link
              href={`/sign-in?redirect_url=${encodedRedirect}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "min-h-[44px] md:min-h-[38px] px-4 gap-1.5 font-semibold",
              })}
            >
              <LogIn className="size-4" aria-hidden="true" />
              <span>Log in</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Count, Sort Toggle & Add Solution */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Layers className="size-5 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-2xl font-semibold text-foreground tracking-tight">
            Solutions (<span className="font-mono tabular-nums">{totalCount}</span>)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div role="group" aria-label="Sort solutions" className="cm-sort-group">
            <button
              type="button"
              onClick={() => setSort("score")}
              data-active={sort === "score" ? "true" : "false"}
              aria-pressed={sort === "score"}
              className="cm-sort-btn"
              title="Sort by Top Score"
            >
              <Award className="cm-sort-icon size-3.5" aria-hidden="true" />
              <span>Top Score</span>
            </button>
            <button
              type="button"
              onClick={() => setSort("newest")}
              data-active={sort === "newest" ? "true" : "false"}
              aria-pressed={sort === "newest"}
              className="cm-sort-btn"
              title="Sort by Newest"
            >
              <Clock className="cm-sort-icon size-3.5" aria-hidden="true" />
              <span>Newest</span>
            </button>
          </div>

          <SolutionFAB problem={problem} variant="inline" />
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
          <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      ) : solutions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No solutions posted yet. Be the first to provide step-by-step working!
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((sol) => (
            <SolutionItem
              key={sol.id}
              solution={sol}
              problem={problem}
              isProblemAuthor={isAuthor}
            />
          ))}

          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full min-h-[44px] md:min-h-0 text-xs"
            >
              {isFetchingNextPage ? "Loading more..." : "Load more solutions"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export const SolutionPoolContainer = SolutionListContainer;
export type SolutionPoolContainerProps = SolutionListContainerProps;
