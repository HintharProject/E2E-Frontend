"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { ForumFeed } from "@/components/features/forum-feed";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { ContributionCard } from "@/components/features/users/contribution-card";
import { PostCardSkeleton } from "@/components/features/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useProblems } from "@/hooks/use-problems";
import { useUserContributions } from "@/hooks/use-user-contributions";
import { useContributionStats } from "@/hooks/use-contribution";
import { getActivityPoints, formatContributionPoints } from "@/lib/contribution-utils";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { cn } from "@/lib/utils";

type ProfileTab = "posts" | "problems" | "contributions";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "problems", label: "Solve!" },
  { id: "contributions", label: "Solutions" },
];

function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="relative space-y-4 border-l border-line pl-0">{children}</div>;
}

function ProblemsTimeline({ userId }: { userId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useProblems({ authorId: userId });

  if (status === "pending") {
    return (
      <div className="space-y-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Could not load problems"
        description="Solve! problems from this user could not be loaded."
      />
    );
  }

  const problems = data.pages.flatMap((page) => page.data);

  if (problems.length === 0) {
    return (
      <EmptyState
        title="No Solve! problems"
        description="Problems this user posted will show up in this timeline."
      />
    );
  }

  return (
    <Timeline>
      {problems.map((problem) => (
        <div key={problem.id} className="relative pl-6">
          <span className="absolute left-0 top-6 size-2.5 rounded-full bg-primary ring-4 ring-background" />
          <ProblemCard problem={problem} />
        </div>
      ))}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      )}
    </Timeline>
  );
}

function ContributionsTimeline({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useUserContributions(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Could not load contributions"
        description="Solutions this user wrote could not be loaded."
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No solutions yet"
        description="Solutions this user posted on Solve! problems will appear here."
      />
    );
  }

  return (
    <Timeline>
      {data.map((solution) => (
        <ContributionCard key={solution.id} solution={solution} />
      ))}
    </Timeline>
  );
}

export function ProfileActivityTabs({ userId }: { userId: string }) {
  const [tab, setTab] = useState<ProfileTab>("posts");
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { data: stats } = useContributionStats(userId);
  const activityPoints = getActivityPoints(stats);

  const pointsMap: Record<ProfileTab, number> = {
    posts: activityPoints.posts,
    problems: activityPoints.problems,
    contributions: activityPoints.solutions,
  };

  const prefetch = async (next: ProfileTab) => {
    const token = await getToken();
    if (!token) return;
    if (next === "problems") {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["problems", { authorId: userId }, "v2"],
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
          const qs = buildQueryString({
            page: pageParam,
            expand: "attachments,author_details,subject_details,level_details",
          });
          const page = await apiFetch<{ data: { author: string }[]; meta: unknown }>(
            `/problems/${qs}`,
            token
          );
          return {
            data: page.data.filter((problem) => problem.author === userId),
            meta: page.meta,
          };
        },
      });
    }
    if (next === "contributions") {
      queryClient.prefetchQuery({ queryKey: ["contributions", userId] });
    }
  };

  return (
    <section className="mt-10">
      <nav className="flex items-center gap-1.5 overflow-x-auto border-b border-line pb-2">
        {TABS.map((item) => {
          const pts = pointsMap[item.id] ?? 0;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => prefetch(item.id)}
              onTouchStart={() => prefetch(item.id)}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-ink-muted hover:bg-muted hover:text-ink"
              )}
            >
              <span>{item.label}</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-ink-muted group-hover:text-ink"
                )}
              >
                {formatContributionPoints(pts)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {tab === "posts" && (
          <div className="relative border-l border-line pl-6">
            <ForumFeed authorId={userId} />
          </div>
        )}
        {tab === "problems" && <ProblemsTimeline userId={userId} />}
        {tab === "contributions" && <ContributionsTimeline userId={userId} />}
      </div>
    </section>
  );
}
