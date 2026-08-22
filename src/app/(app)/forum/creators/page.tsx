import { PostCard } from "@/components/features/content-cards";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { posts } from "@/lib/mock-data";
import Link from "next/link";

export default function CreatorsFeedPage() {
  // Mock: posts from followed creators (creator1 + creator2)
  const feed = posts.filter((p) =>
    ["u-creator1", "u-creator2"].includes(p.authorId),
  );

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
      {feed.length === 0 ? (
        <EmptyState
          title="No followed creators"
          description="Follow creators from their profiles to fill this feed."
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
