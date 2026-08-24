import { Suspense } from "react";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { ForumSubNav } from "@/components/features/forum/forum-sub-nav";
import { parseFilterList } from "@/lib/filter-params";
import { ForumFeed } from "@/components/features/forum-feed";

export default async function ForumMainPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const postTypes = parseFilterList(searchParams?.post_type);
  const tagIds = parseFilterList(searchParams?.tags);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Forum" />
      <ForumSubNav
        activeHref="/forum"
        filterProps={{ showPostType: true }}
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar showPostType />
        </Suspense>
        <div className="min-w-0 flex-1">
          <ForumFeed 
            subjects={subjects} 
            levels={levels} 
            postTypes={postTypes} 
            tagIds={tagIds} 
            feed="main"
          />
        </div>
      </div>
    </div>
  );
}
