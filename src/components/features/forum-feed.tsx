"use client";

import { useInfinitePosts } from "@/hooks/use-posts";
import { PostCard } from "./content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PostCardSkeleton } from "./skeletons";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";

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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch, isRefetching } =
    useInfinitePosts({
      subject: subjects.join(","),
      level: levels.join(","),
      type: postTypes.join(","),
      tags: tagIds.join(","),
      feed,
      authorId,
    });

  const hasActiveFilters =
    subjects.length > 0 || levels.length > 0 || postTypes.length > 0 || tagIds.length > 0;

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-4">
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

  const posts = data.pages.flatMap((page) => page.data);

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
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="secondary"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading more..." : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </TopmostScrollRefresh>
  );
}
