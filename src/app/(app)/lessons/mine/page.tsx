import { LessonCard } from "@/components/features/content-cards";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { currentUser } from "@clerk/nextjs/server";
import { lessons } from "@/lib/mock-data";
import Link from "next/link";

export default async function MyLessonsPage(props: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const searchParams = await props.searchParams;
  const clerkUser = await currentUser();
  const userId = clerkUser?.id || "u-creator1";

  const state = searchParams?.state;
  const active =
    (state?.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED";

  const filtered = lessons.filter(
    (l) => l.state === active && l.authorId === userId,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="My lessons"
        description="Manage your Draft, Published, and Archived lessons."
        actions={<Button nativeButton={false} render={<Link href="/lessons/new" />}>New lesson</Button>}
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
