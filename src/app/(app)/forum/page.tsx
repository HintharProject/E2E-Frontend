import { PostCard } from "@/components/content-cards";
import {
  Button,
  EmptyState,
  Field,
  FilterBar,
  PageHeader,
  SubNav,
  inputClass,
} from "@/components/ui";
import { levels, posts, subjects, tags } from "@/lib/mock-data";

export default function ForumMainPage() {
  const feed = posts.filter(
    (p) => p.postType === "QUESTION" || p.postType === "SHARING",
  ).filter((p) => {
    const authorRole =
      p.authorId === "u-admin"
        ? "ADMIN"
        : p.authorId.startsWith("u-creator")
          ? "CREATOR"
          : "STUDENT";
    // Main feed: student Q/S primarily; keep student-authored items
    return authorRole === "STUDENT";
  });

  return (
    <div>
      <PageHeader
        title="Forum"
        description="Main feed — student questions and sharing. Posts expire after 30 days."
        actions={<Button href="/posts/new">New post</Button>}
      />
      <SubNav
        items={[
          { href: "/forum", label: "Main", active: true },
          { href: "/forum/announcements", label: "Announcements" },
          { href: "/forum/creators", label: "Creators" },
        ]}
      />
      <FilterBar>
        <Field label="Subject">
          <select className={inputClass} defaultValue="">
            <option value="">All</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Level">
          <select className={inputClass} defaultValue="">
            <option value="">All</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select className={inputClass} defaultValue="">
            <option value="">All</option>
            <option value="QUESTION">Question</option>
            <option value="SHARING">Sharing</option>
          </select>
        </Field>
        <Field label="Tag">
          <select className={inputClass} defaultValue="">
            <option value="">All</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>
      {feed.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Be the first to ask a question or share something useful."
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
