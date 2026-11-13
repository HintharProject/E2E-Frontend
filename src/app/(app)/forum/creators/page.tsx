import { Suspense } from "react";
import { HorizontalFilterBar } from "@/components/layout/horizontal-filter-bar";
import { parseFilterList } from "@/lib/filter-params";
import { ForumFeed } from "@/components/features/forum-feed";

export default async function CreatorsFeedPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const postTypes = parseFilterList(searchParams?.post_type);
  const tagIds = parseFilterList(searchParams?.tags);

  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<div className="h-12 rounded-xl bg-card border border-border animate-pulse" />}>
        <HorizontalFilterBar showPostType showSort />
      </Suspense>
      <div className="min-w-0 flex-1">
        <ForumFeed
          subjects={subjects}
          levels={levels}
          tagIds={tagIds}
          postTypes={postTypes}
          feed="creator"
          hideSort
        />
      </div>
    </div>
  );
}
