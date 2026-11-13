"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useInfinitePosts } from "@/hooks/use-posts";
import { useDualStateFilter } from "@/hooks/use-dual-state-filter";
import { PostCard } from "./content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PostCardSkeleton } from "./skeletons";
import { ColdStartNotice } from "@/components/layout/cold-start-notice";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";
import { ContentSortToggle } from "@/components/ui/content-sort-toggle";
import type { Post, ContentSortMode, TimeframeFilter } from "@/types";

export function ForumFeed({
  subjects = [],
  levels = [],
  postTypes = [],
  tagIds = [],
  feed,
  authorId,
}: {
  subjects?: string[];
  levels?: string[];
  postTypes?: string[];
  tagIds?: string[];
  feed?: 'main' | 'announcement' | 'creator';
  authorId?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const currentSort = (searchParams.get("sort") as ContentSortMode) || "default";
  const currentTimeframe = (searchParams.get("timeframe") as TimeframeFilter) || "all";

  const handleSortChange = (newSort: ContentSortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "default") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      window.history.replaceState(null, "", newUrl);
    });
  };

  const handleTimeframeChange = (newTf: TimeframeFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTf === "all") {
      params.delete("timeframe");
    } else {
      params.set("timeframe", newTf);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      window.history.replaceState(null, "", newUrl);
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, status, refetch, isRefetching } =
    useInfinitePosts({
      subject: subjects.join(","),
      level: levels.join(","),
      type: postTypes.join(","),
      tags: tagIds.join(","),
      feed,
      authorId,
      sort: currentSort,
      timeframe: currentTimeframe,
    });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasActiveFilters =
    subjects.length > 0 || levels.length > 0 || postTypes.length > 0 || tagIds.length > 0;

  const activeFiltersKey = [
    subjects.join(","),
    levels.join(","),
    postTypes.join(","),
    tagIds.join(","),
    feed || "",
    authorId || "",
  ].join("|");

  const filterPredicate = useCallback((post: Post) => {
    if (subjects.length > 0 && (!post.subject || !subjects.includes(post.subject))) return false;
    if (levels.length > 0 && (!post.level || !levels.includes(post.level))) return false;
    if (postTypes.length > 0 && !postTypes.includes(post.post_type)) return false;
    if (authorId && post.author !== authorId) return false;
    return true;
  }, [subjects, levels, postTypes, authorId]);

  const rawPosts = data?.pages.flatMap((page) => page.data);

  const { displayItems: posts, isOptimistic, isEmptyPending } = useDualStateFilter<Post>({
    items: rawPosts,
    isFetching,
    filterPredicate,
    activeFiltersKey,
  });

  if (status === "pending" || isEmptyPending) {
    return (
      <div className="flex flex-col gap-4">
        <ColdStartNotice delayMs={3000} />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Error loading posts"
        description="Could not load the forum feed. Please try again."
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title={hasActiveFilters ? "No matching posts" : "No posts yet"}
        description={
          hasActiveFilters
            ? "Try clearing filters or picking different Subject, Level, Type, or Tag."
            : "Be the first to ask a question or share something useful."
        }
      />
    );
  }

  return (
    <TopmostScrollRefresh
      onRefresh={() => refetch()}
      isRefreshing={isRefetching}
      label="posts"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-1">
          <ContentSortToggle
            sort={currentSort}
            timeframe={currentTimeframe}
            onSortChange={handleSortChange}
            onTimeframeChange={handleTimeframeChange}
          />
        </div>

        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {isOptimistic && (
          <div className="flex flex-col gap-4 pt-2">
            <PostCardSkeleton />
          </div>
        )}

        {!isOptimistic && hasNextPage && (
          <div ref={loadMoreRef} className="mt-4 flex justify-center py-4">
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
    </TopmostScrollRefresh>
  );
}
