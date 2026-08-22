import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  getLesson,
  getUser,
  studyPlans,
} from "@/lib/mock-data";

export default async function StudyPlanDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const plan = studyPlans.find((p) => p.id === id);
  if (!plan) notFound();
  const owner = getUser(plan.ownerId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={plan.title}
        description={`Owned by ${owner?.displayName ?? "unknown"} · shareable when public`}
        actions={
          <>
            <Button variant="secondary">
              {plan.isPublic ? "Make private" : "Make public"}
            </Button>
            <Button variant="ghost">Copy share URL</Button>
            <Button variant="destructive">Delete</Button>
          </>
        }
      />
      <div className="mb-4 flex gap-2">
        <Badge variant={plan.isPublic ? "default" : "outline"}>
          {plan.isPublic ? "Public" : "Private"}
        </Badge>
        <Badge variant="outline">/study-plans/{plan.id}</Badge>
      </div>
      <ul className="space-y-3">
        {plan.lessonIds.map((lessonId) => {
          const lesson = getLesson(lessonId);
          if (!lesson) return null;
          return (
            <li key={lessonId}>
              <Link
                href={`/lessons/${lesson.id}`}
                className="block rounded-xl border border-line bg-card px-4 py-3 hover:border-brand/40"
              >
                <p className="font-semibold text-ink">{lesson.title}</p>
                <p className="text-xs text-ink-muted">{lesson.state}</p>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6">
        <Button variant="secondary" nativeButton={false} render={<Link href="/study-plans" />}>
          Back to plans
        </Button>
      </div>
    </div>
  );
}
