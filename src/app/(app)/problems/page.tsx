"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Virtuoso } from "react-virtuoso";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { useProblems } from "@/hooks/use-problems";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isWriteLocked } from "@/types/user";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";
import { parseFilterList } from "@/lib/filter-params";

function ProblemsFeed() {
  const searchParams = useSearchParams();
  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));
  const status = searchParams.get("status") || "";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useProblems({
    subject: subjects.length > 0 ? subjects[0] : "", // useProblems hook might need updating if it supports multiple, assuming single for now
    level: levels.length > 0 ? levels[0] : "",
    status: status,
  });

  const problems = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <TopmostScrollRefresh
      onRefresh={() => refetch()}
      isRefreshing={isRefetching}
      label="problems"
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>
          <div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>
          <div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>
        </div>
      ) : isError ? (
        <EmptyState
          title="Failed to load problems"
          description="We ran into an issue retrieving the data. Please try again."
        />
      ) : problems.length === 0 ? (
        <EmptyState
          title="No problems found"
          description="Try adjusting your filters or be the first to post a problem."
        />
      ) : (
        <Virtuoso
          useWindowScroll
          data={problems}
          endReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          components={{
            Footer: () => (
              isFetchingNextPage ? (
                <div className="py-4 text-center text-sm text-ink-muted">Loading more...</div>
              ) : null
            )
          }}
          itemContent={(index, problem) => (
            <div className="pb-4">
              <ProblemCard problem={problem} />
            </div>
          )}
        />
      )}
    </TopmostScrollRefresh>
  );
}

export default function ProblemsPage() {
  const { user } = useCurrentUser();
  
  const writeLocked = user ? isWriteLocked(user.ban_state) : false;
  const isCreator = user?.role === "CREATOR";
  const canPost = !writeLocked && !isCreator;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Problems & Solutions"
        description="Ask difficult questions and get step-by-step solutions from the community."
        actions={
          canPost ? (
            <Button nativeButton={false} render={<Link href="/problems/new" />}>
              Post a Problem
            </Button>
          ) : undefined
        }
      />

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar hideTags showProblemStatus />
        </Suspense>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>}>
            <ProblemsFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
