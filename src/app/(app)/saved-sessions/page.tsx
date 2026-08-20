import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SubNav,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { savedSessions } from "@/lib/mock-data";

export default async function SavedSessionsPage() {
  const user = await requireUser();
  const mine = savedSessions.filter((s) => s.ownerId === user.id);
  const hasEmpty = mine.some(
    (s) => s.postIds.length === 0 && s.lessonIds.length === 0,
  );
  const atCap = mine.length >= 3;
  const canCreate = !atCap && !hasEmpty;

  return (
    <div>
      <PageHeader
        title="Saved sessions"
        description="Up to 3 sessions of posts and lessons. Posts disappear from sessions when they expire."
        actions={
          <Button disabled={!canCreate} href={canCreate ? "#" : undefined}>
            {atCap ? "Limit reached (3)" : hasEmpty ? "Empty session exists" : "New session"}
          </Button>
        }
      />
      <SubNav
        items={[
          { href: "/study-plans", label: "Study Plans" },
          { href: "/saved-sessions", label: "Saved Sessions", active: true },
        ]}
      />
      {mine.length === 0 ? (
        <EmptyState
          title="No saved sessions"
          description="Save posts and lessons while browsing."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.map((session) => (
            <Link
              key={session.id}
              href={`/saved-sessions/${session.id}`}
              className="rounded-2xl border border-line bg-white p-5 transition hover:border-brand/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-xl text-ink">{session.title}</h2>
                <Badge tone={session.isPublic ? "brand" : "muted"}>
                  {session.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {session.postIds.length} posts · {session.lessonIds.length}{" "}
                lessons
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
