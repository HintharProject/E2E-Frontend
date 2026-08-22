import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentUser } from "@clerk/nextjs/server";

export default async function StudyPlansPage() {
  const clerkUser = await currentUser();
  const userId = clerkUser?.id;

  // TODO: Fetch study plans from API in Phase 6
  const mine: any[] = [];
  const hasEmpty = false;
  const atCap = false;
  const canCreate = !atCap && !hasEmpty;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Study plans"
        description="Up to 3 plans of lessons only. Cannot create another while one is empty."
        actions={
          <Button disabled={!canCreate} nativeButton={false} render={canCreate ? <Link href="#" /> : undefined}>
            {atCap ? "Limit reached (3)" : hasEmpty ? "Empty plan exists" : "New plan"}
          </Button>
        }
      />
      <SubNav
        items={[
          { href: "/study-plans", label: "Study Plans", active: true },
          { href: "/saved-sessions", label: "Saved Sessions" },
        ]}
      />
      {mine.length === 0 ? (
        <EmptyState
          title="No study plans"
          description="Collect lessons into a focused plan."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.map((plan) => (
            <Link
              key={plan.id}
              href={`/study-plans/${plan.id}`}
              className="rounded-2xl border border-line bg-card p-5 transition hover:border-brand/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-xl text-ink">{plan.title}</h2>
                <Badge variant={plan.isPublic ? "default" : "outline"}>
                  {plan.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {plan.lessonIds.length} lesson
                {plan.lessonIds.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
