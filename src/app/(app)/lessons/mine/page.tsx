import { LessonCard } from "@/components/content-cards";
import {
  Button,
  EmptyState,
  PageHeader,
  SubNav,
} from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { lessons } from "@/lib/mock-data";

export default async function MyLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const user = await requireRole(["CREATOR"]);
  const { state } = await searchParams;
  const active =
    (state?.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED";

  const filtered = lessons.filter(
    (l) => l.state === active && l.authorId === user.id,
  );

  return (
    <div>
      <PageHeader
        title="My lessons"
        description="Manage your Draft, Published, and Archived lessons."
        actions={<Button href="/lessons/new">New lesson</Button>}
      />
      <SubNav
        items={[
          {
            href: "/lessons/mine?state=DRAFT",
            label: "Draft",
            active: active === "DRAFT",
          },
          {
            href: "/lessons/mine?state=PUBLISHED",
            label: "Published",
            active: active === "PUBLISHED",
          },
          {
            href: "/lessons/mine?state=ARCHIVED",
            label: "Archived",
            active: active === "ARCHIVED",
          },
        ]}
      />
      {filtered.length === 0 ? (
        <EmptyState
          title={`No ${active.toLowerCase()} lessons`}
          description="Create a lesson or change state from the editor."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
