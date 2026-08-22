import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { ForumFeed } from "@/components/features/forum-feed";
import Link from "next/link";

export default function CreatorsFeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Creators feed"
        description="Posts from creators you follow — questions, sharing, and announcements."
        actions={<Button nativeButton={false} render={<Link href="/posts/new" />}>New post</Button>}
      />
      <SubNav
        items={[
          { href: "/forum", label: "Main" },
          { href: "/forum/announcements", label: "Announcements" },
          { href: "/forum/creators", label: "Creators", active: true },
        ]}
      />
      <div className="mt-6">
        <ForumFeed 
          subjects={[]} 
          levels={[]} 
          tagIds={[]} 
          postTypes={[]} 
        />
      </div>
    </div>
  );
}
