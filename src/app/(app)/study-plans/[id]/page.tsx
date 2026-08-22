import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default async function StudyPlanDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  
  // TODO: Fetch study plan from API in Phase 6
  const plan: any = null;

  if (!plan) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={plan.title}
        description={`Owned by ${"unknown"} · shareable when public`}
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
        {/*
        {plan.lessonIds.map((lessonId) => {
          return null;
        })}
        */}
      </ul>
      <div className="mt-6">
        <Button variant="secondary" nativeButton={false} render={<Link href="/study-plans" />}>
          Back to plans
        </Button>
      </div>
    </div>
  );
}
