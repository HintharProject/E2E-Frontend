import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SubNav,
} from "@/components/ui";
import { getCurrentUser, studyPlans } from "@/lib/mock-data";

export default function StudyPlansPage() {
  const user = getCurrentUser();
  const mine = studyPlans.filter((p) => p.ownerId === user.id);
  const hasEmpty = mine.some((p) => p.lessonIds.length === 0);
  const atCap = mine.length >= 3;
  const canCreate = !atCap && !hasEmpty;

  return (
    <div>
      <PageHeader
        title="Study plans"
        description="Up to 3 plans of lessons only. Cannot create another while one is empty."
        actions={
          <Button disabled={!canCreate} href={canCreate ? "#" : undefined}>
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
              className="rounded-2xl border border-line bg-white p-5 transition hover:border-brand/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-xl text-ink">{plan.title}</h2>
                <Badge tone={plan.isPublic ? "brand" : "muted"}>
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
