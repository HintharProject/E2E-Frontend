import { PostCard } from "@/components/content-cards";
import { Button, EmptyState, PageHeader, SubNav } from "@/components/ui";
import { posts } from "@/lib/mock-data";

export default function AnnouncementsFeedPage() {
  const feed = posts.filter(
    (p) => p.postType === "ANNOUNCEMENT" && p.authorId === "u-admin",
  );

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Official updates from Admins. Voting is disabled on announcements."
        actions={<Button href="/posts/new">New post</Button>}
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
