import { PageHeader } from "@/components/ui/page-header";
import { ForumSubNav } from "@/components/features/forum/forum-sub-nav";
import { ForumFeed } from "@/components/features/forum-feed";

export default function CreatorsFeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader title="Creators feed" />
      <ForumSubNav activeHref="/forum/creators" />
      <div className="mt-6">
        <ForumFeed 
          subjects={[]} 
          levels={[]} 
          tagIds={[]} 
          postTypes={[]} 
          feed="creator"
        />
      </div>
    </div>
  );
}
