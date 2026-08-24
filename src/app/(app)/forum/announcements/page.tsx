import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PrefetchingSubNav as SubNav } from "@/components/ui/prefetching-sub-nav";
import { ForumFeed } from "@/components/features/forum-feed";
import Link from "next/link";

export default function AnnouncementsFeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Announcements"
        description="Official updates from Admins. Voting is disabled on announcements."
        actions={<Button nativeButton={false} render={<Link href="/posts/new" />}>New post</Button>}
      />
      <SubNav
        items={[
          { href: "/forum", label: "Main" },
          { href: "/forum/announcements", label: "Announcements", active: true },
          { href: "/forum/creators", label: "Creators" },
        ]}
      />
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
