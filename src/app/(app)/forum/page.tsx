import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { HorizontalFilterBar } from "@/components/layout/horizontal-filter-bar";
import { parseFilterList } from "@/lib/filter-params";
import { ForumFeed } from "@/components/features/forum-feed";
import { ForumRightRail } from "@/components/features/forum/forum-right-rail";
import { Button } from "@/components/ui/button";

export default async function ForumMainPage(props: {
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
        <HorizontalFilterBar
          showPostType
          showSort
          rightActions={
            <Button
              size="sm"
              className="xl:hidden gap-1.5"
              nativeButton={false}
              render={<Link href="/posts/new" />}
            >
              <Plus className="size-4" />
              New Post
            </Button>
          }
        />
      </Suspense>
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="min-w-0 flex-1 w-full">
          <ForumFeed
            subjects={subjects}
            levels={levels}
            postTypes={postTypes}
            tagIds={tagIds}
            feed="main"
            hideSort
          />
        </div>
        <ForumRightRail />
      </div>
    </div>
  );
}
