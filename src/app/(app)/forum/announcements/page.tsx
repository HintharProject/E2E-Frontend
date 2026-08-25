import { PageHeader } from "@/components/ui/page-header";
import { ForumSubNav } from "@/components/features/forum/forum-sub-nav";
import { ForumFeed } from "@/components/features/forum-feed";

export default function AnnouncementsFeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-8 sm:px-6">
      <ForumSubNav activeHref="/forum/announcements" />
      <div className="mt-6">
        <ForumFeed 
          subjects={[]} 
          levels={[]} 
          tagIds={[]} 
          postTypes={["ANNOUNCEMENT"]} 
          feed="announcement"
        />
      </div>
    </div>
  );
}
