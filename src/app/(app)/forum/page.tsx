import { Suspense } from "react";
import { PostCard } from "@/components/features/content-cards";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { parseFilterList } from "@/lib/filter-params";
import { getUser, posts, type Post, type PostType } from "@/lib/mock-data";
import Link from "next/link";

function isStudentAuthor(authorId: string): boolean {
  return getUser(authorId)?.role === "STUDENT";
}

function filterMainFeed(
  all: Post[],
  filters: {
    subjects: string[];
    levels: string[];
    postTypes: string[];
    tagIds: string[];
  }
): Post[] {
  return all.filter((p) => {
    if (p.postType !== "QUESTION" && p.postType !== "SHARING") return false;
    if (!isStudentAuthor(p.authorId)) return false;

    if (
      filters.subjects.length > 0 &&
      (!p.subjectId || !filters.subjects.includes(p.subjectId))
    ) {
      return false;
    }
    if (
      filters.levels.length > 0 &&
      (!p.levelId || !filters.levels.includes(p.levelId))
    ) {
      return false;
    }
    if (
      filters.postTypes.length > 0 &&
      !filters.postTypes.includes(p.postType as PostType)
    ) {
      return false;
    }
    if (
      filters.tagIds.length > 0 &&
      !filters.tagIds.some((id) => p.tagIds.includes(id))
    ) {
      return false;
    }
    return true;
  });
}

export default async function ForumMainPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const postTypes = parseFilterList(searchParams?.post_type);
  const tagIds = parseFilterList(searchParams?.tags);

  const feed = filterMainFeed(posts, {
    subjects,
    levels,
    postTypes,
    tagIds,
  });
  
  const hasActiveFilters =
    subjects.length > 0 ||
    levels.length > 0 ||
    postTypes.length > 0 ||
    tagIds.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Forum"
        description="Main feed — student questions and sharing. Posts expire after 30 days."
        actions={
          <Button nativeButton={false} render={<Link href="/posts/new" />}>New post</Button>
        }
      />
      <SubNav
        items={[
          { href: "/forum", label: "Main", active: true },
          { href: "/forum/announcements", label: "Announcements" },
          { href: "/forum/creators", label: "Creators" },
        ]}
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar showPostType />
        </Suspense>
        <div className="min-w-0 flex-1">
          {feed.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? "No matching posts" : "No posts yet"}
              description={
                hasActiveFilters
                  ? "Try clearing filters or picking different Subject, Level, Type, or Tag."
                  : "Be the first to ask a question or share something useful."
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {feed.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
