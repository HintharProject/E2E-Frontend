import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, PageHeader } from "@/components/ui";
import {
  getLesson,
  getUser,
  studyPlans,
} from "@/lib/mock-data";

export default async function StudyPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = studyPlans.find((p) => p.id === id);
  if (!plan) notFound();
  const owner = getUser(plan.ownerId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={plan.title}
        description={`Owned by ${owner?.displayName ?? "unknown"} · shareable when public`}
        actions={
          <>
            <Button variant="secondary">
              {plan.isPublic ? "Make private" : "Make public"}
            </Button>
            <Button variant="ghost">Copy share URL</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />
      <div className="mb-4 flex gap-2">
        <Badge tone={plan.isPublic ? "brand" : "muted"}>
          {plan.isPublic ? "Public" : "Private"}
        </Badge>
        <Badge tone="muted">/study-plans/{plan.id}</Badge>
      </div>
      <ul className="space-y-3">
        {plan.lessonIds.map((lessonId) => {
          const lesson = getLesson(lessonId);
          if (!lesson) return null;
          return (
            <li key={lessonId}>
              <Link
                href={`/lessons/${lesson.id}`}
                className="block rounded-xl border border-line bg-white px-4 py-3 hover:border-brand/40"
              >
                <p className="font-semibold text-ink">{lesson.title}</p>
                <p className="text-xs text-ink-muted">{lesson.state}</p>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6">
        <Button href="/study-plans" variant="secondary">
          Back to plans
        </Button>
      </div>
    </div>
  );
}
