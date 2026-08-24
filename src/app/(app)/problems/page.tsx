"use client";

import { useState } from "react";
import Link from "next/link";
import { Virtuoso } from "react-virtuoso";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { useProblems } from "@/hooks/use-problems";
import { FilterBar } from "@/components/ui/filter-bar";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isWriteLocked } from "@/types/user";

export default function ProblemsPage() {
  const { user } = useCurrentUser();
  const [subjectFilter, setSubjectFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProblems({
    subject: subjectFilter,
    level: levelFilter,
    status: statusFilter,
  });

  const problems = data?.pages.flatMap((p) => p.data) ?? [];

  const subjectOptions = subjects.map(s => ({ value: s.id, label: s.name }));
  const levelOptions = levels.map(l => ({ value: l.id, label: l.name }));
  const statusOptions = [
    { value: "OPEN", label: "Open" },
    { value: "SOLVED", label: "Solved" },
    { value: "CLOSED", label: "Closed" },
  ];

  const writeLocked = user ? isWriteLocked(user.ban_state) : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Problems & Solutions"
        description="Ask difficult questions and get step-by-step solutions from the community."
        actions={
          <Button disabled={writeLocked} nativeButton={false} render={<Link href="/problems/new" />}>
            Post a Problem
          </Button>
        }
      />

      <FilterBar
        filters={[
          {
            key: "subject",
            label: "Subject",
            options: subjectOptions,
            value: subjectFilter,
            onChange: setSubjectFilter,
          },
          {
            key: "level",
            label: "Level",
            options: levelOptions,
            value: levelFilter,
            onChange: setLevelFilter,
          },
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />

      <div className="mt-8">
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
      </div>
    </div>
  );
}
