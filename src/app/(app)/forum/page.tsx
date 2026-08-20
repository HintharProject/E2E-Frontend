import { Suspense } from "react";
import { PostCard } from "@/components/content-cards";
import { FilterSidebar } from "@/components/filter-sidebar";
import {
  Button,
  EmptyState,
  PageHeader,
  SubNav,
} from "@/components/ui";
import { parseFilterList } from "@/lib/filter-params";
import { getUser, posts, type Post, type PostType } from "@/lib/mock-data";

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
  },
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

export default async function ForumMainPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject?: string | string[];
    level?: string | string[];
    post_type?: string | string[];
    tags?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const subjects = parseFilterList(params.subject);
  const levels = parseFilterList(params.level);
  const postTypes = parseFilterList(params.post_type);
  const tagIds = parseFilterList(params.tags);

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
    <div>
      <PageHeader
        title="Forum"
        description="Main feed — student questions and sharing. Posts expire after 30 days."
        actions={<Button href="/posts/new">New post</Button>}
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
