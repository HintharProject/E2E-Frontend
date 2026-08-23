"use client";

import { useInfinitePosts } from "@/hooks/use-posts";
import { PostCard } from "./content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export function ForumFeed({
  subjects,
  levels,
  postTypes,
  tagIds,
  feed,
}: {
  subjects: string[];
  levels: string[];
  postTypes: string[];
  tagIds: string[];
  feed?: 'main' | 'announcement' | 'creator';
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfinitePosts({
      subject: subjects.join(","),
      level: levels.join(","),
      type: postTypes.join(","),
      tags: tagIds.join(","),
      feed,
    });

  const hasActiveFilters =
    subjects.length > 0 || levels.length > 0 || postTypes.length > 0 || tagIds.length > 0;

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-32 animate-pulse rounded-2xl bg-card border border-line" />
        <div className="h-32 animate-pulse rounded-2xl bg-card border border-line" />
        <div className="text-center text-sm text-ink-muted">Waking up server... (can take up to 60s)</div>
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
  );
}
