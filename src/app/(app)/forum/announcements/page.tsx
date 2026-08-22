import { PostCard } from "@/components/features/content-cards";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { posts } from "@/lib/mock-data";
import Link from "next/link";

export default function AnnouncementsFeedPage() {
  const feed = posts.filter(
    (p) => p.postType === "ANNOUNCEMENT" && p.authorId === "u-admin",
  );

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
      {feed.length === 0 ? (
        <EmptyState
          title="No announcements"
          description="Admin announcements will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {feed.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
