import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServerAuthToken } from "@/lib/auth-server";
import { apiFetch } from "@/services/api-client";
import { PaginatedResponse, StudyPlan } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  GraduationCap,
  Lock,
  Globe,
  ArrowRight,
  Plus,
  AlertCircle,
  Layers,
} from "lucide-react";

export default async function StudyPlansPage() {
  const token = await getServerAuthToken();
  
  let mine: StudyPlan[] = [];
  if (token) {
    try {
      const res = await apiFetch<PaginatedResponse<StudyPlan>>(
        "/study-plans/?expand=items",
        token
      );
      mine = res.data || [];
    } catch (error) {
      console.error("Failed to fetch study plans:", error);
    }
  }

  const hasEmpty = mine.some((plan) => !plan.items || plan.items.length === 0);
  const atCap = mine.length >= 12;
  const canCreate = Boolean(token) && !atCap && !hasEmpty;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Study plans"
        description="Curate structured, sequential learning paths from lessons. Up to 12 study plans per account."
        actions={
          canCreate ? (
            <Button
              nativeButton={false}
              render={<Link href="/study-plans/new" />}
              className="gap-2 px-4 py-2 font-medium shadow-xs"
            >
              <Plus className="h-4 w-4" />
              New plan
            </Button>
          ) : (
            <Button disabled className="gap-2">
              {atCap ? "Limit reached (12)" : hasEmpty ? "Empty plan exists" : "New plan"}
            </Button>
          )
        }
      />

      <div className="mt-2 mb-6">
        <SubNav
          items={[
            { href: "/study-plans", label: "Study Plans", active: true },
            { href: "/saved-sessions", label: "Saved Sessions" },
          ]}
        />
      </div>

      {/* Plan capacity indicator & hints */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/60 bg-muted/30 px-4 py-3 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand" />
          <span>
            <strong className="text-ink font-semibold">{mine.length}</strong> of 12 study plans used
          </span>
        </div>
        {hasEmpty && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>You have an empty plan. Add lessons to it before creating another.</span>
          </div>
        )}
      </div>

      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card/40 p-12 text-center sm:p-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">No study plans yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted leading-relaxed">
            Organize lessons into a step-by-step syllabus to master complex subjects and track your learning progress.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {canCreate ? (
              <Button nativeButton={false} render={<Link href="/study-plans/new" />} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create your first plan
              </Button>
            ) : (
              <Button nativeButton={false} render={<Link href="/lessons" />} variant="outline">
                Browse Lessons
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((plan) => {
            const itemCount = plan.items?.length || 0;
            const isEmpty = itemCount === 0;

            return (
              <Link
                key={plan.id}
                href={`/study-plans/${plan.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:scale-105 transition-transform">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={plan.is_public ? "default" : "outline"}
                        className="gap-1 text-[11px] font-normal"
                      >
                        {plan.is_public ? (
                          <>
                            <Globe className="h-3 w-3" /> Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Private
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <h2 className="font-display text-lg font-bold text-ink group-hover:text-brand transition-colors line-clamp-2">
                    {plan.title}
                  </h2>

                  <p className="mt-2 text-xs text-ink-muted">
                    Created {formatDate(plan.created_at)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs">
                  <span
                    className={
                      isEmpty
                        ? "text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"
                        : "text-ink-muted font-medium"
                    }
                  >
                    {isEmpty ? (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Empty plan
                      </>
                    ) : (
                      <>
                        <strong className="text-ink font-semibold">{itemCount}</strong>{" "}
                        {itemCount === 1 ? "lesson" : "lessons"}
                      </>
                    )}
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-brand transition-transform group-hover:translate-x-0.5">
                    View plan <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
