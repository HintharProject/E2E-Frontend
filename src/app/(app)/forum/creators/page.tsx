import { PostCard } from "@/components/content-cards";
import { Button, EmptyState, PageHeader, SubNav } from "@/components/ui";
import { posts } from "@/lib/mock-data";

export default function CreatorsFeedPage() {
  // Mock: posts from followed creators (creator1 + creator2)
  const feed = posts.filter((p) =>
    ["u-creator1", "u-creator2"].includes(p.authorId),
  );

  return (
    <div>
      <PageHeader
        title="Creators feed"
        description="Posts from creators you follow — questions, sharing, and announcements."
        actions={<Button href="/posts/new">New post</Button>}
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
