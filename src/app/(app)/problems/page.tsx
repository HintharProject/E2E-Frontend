"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { ProblemCardSkeleton } from "@/components/features/skeletons";
import { ProblemsRightRail } from "@/components/features/problems/problems-right-rail";
import { ColdStartNotice } from "@/components/layout/cold-start-notice";
import { useProblems } from "@/hooks/use-problems";
import { HorizontalFilterBar } from "@/components/layout/horizontal-filter-bar";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";
import { GatedLink } from "@/components/features/auth/gated-link";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import { parseFilterList } from "@/lib/filter-params";
import type { ConfidenceFilterValue, ContentSortMode, TimeframeFilter } from "@/types";

function ProblemsFeed() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuthGate();

  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));
  const confidence = (searchParams.get("confidence") as ConfidenceFilterValue) || "";
  const currentSort = (searchParams.get("sort") as ContentSortMode) || "default";
  const currentTimeframe = (searchParams.get("timeframe") as TimeframeFilter) || "all";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useProblems({
    subject: subjects.length > 0 ? subjects[0] : "",
    level: levels.length > 0 ? levels[0] : "",
    confidence,
    sort: currentSort,
    timeframe: currentTimeframe,
  });

  const problems = data?.pages.flatMap((p) => p.data) ?? [];
  const errStatus = (error as { status?: number } | null)?.status;

  return (
    <TopmostScrollRefresh
      onRefresh={() => refetch()}
      isRefreshing={isRefetching}
      label="problems"
    >
      {isLoading ? (
        <div className="space-y-4">
          <ColdStartNotice delayMs={3000} />
          <ProblemCardSkeleton />
          <ProblemCardSkeleton />
          <ProblemCardSkeleton />
        </div>
      ) : isError ? (
        !isSignedIn && (errStatus === 401 || errStatus === 403) ? (
          <EmptyState
            title="Sign in to browse Solve!"
            description="Sign up free or log in to explore peer questions, worked solutions, and past-paper discussions."
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/sign-up?redirect_url=%2Fproblems" />}
                >
                  Sign up free
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/sign-in?redirect_url=%2Fproblems" />}
                >
                  Log in
                </Button>
              </div>
            }
          />
        ) : (
          <EmptyState
            title="Failed to load problems"
            description="We ran into an issue retrieving the data. Please try again."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        )
      ) : problems.length === 0 ? (
        <EmptyState
          title="No problems found"
          description="Try adjusting your filters or be the first to post a problem."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-h-[44px] md:min-h-0"
              >
                {isFetchingNextPage ? "Loading more..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </TopmostScrollRefresh>
  );
}

export default function ProblemsPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<div className="h-12 rounded-xl bg-card border border-border animate-pulse" />}>
        <HorizontalFilterBar
          hideTags
          showConfidenceFilter
          showSort
          rightActions={
            <Button
              size="sm"
              className="xl:hidden gap-1.5"
              nativeButton={false}
              render={<GatedLink href="/problems/new" actionLabel="ask a problem in Solve!" />}
            >
              <Plus className="size-4" />
              Ask Question
            </Button>
          }
        />
      </Suspense>
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="min-w-0 flex-1 w-full">
          <Suspense
            fallback={
              <div className="space-y-4">
                <ProblemCardSkeleton />
                <ProblemCardSkeleton />
                <ProblemCardSkeleton />
              </div>
            }
          >
            <ProblemsFeed />
          </Suspense>
        </div>
        <ProblemsRightRail />
      </div>
    </div>
  );
}
