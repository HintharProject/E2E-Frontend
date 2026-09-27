"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Lock,
  Globe,
  Share2,
  Trash2,
  Pencil,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useStudyPlan,
  useUpdateStudyPlan,
  useDeleteStudyPlan,
  useRemoveStudyPlanItem,
} from "@/hooks/use-collections";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StudyPlanItem } from "@/types";

export default function StudyPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();

  const { data: plan, isLoading, isError } = useStudyPlan(id);
  const updateMutation = useUpdateStudyPlan();
  const deleteMutation = useDeleteStudyPlan();
  const removeMutation = useRemoveStudyPlanItem();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Study plan not found</h2>
        <p className="mt-2 text-sm text-ink-muted">
          This study plan may be private or has been removed.
        </p>
        <Button variant="outline" className="mt-6" nativeButton={false} render={<Link href="/study-plans" />}>
          Back to Study Plans
        </Button>
      </div>
    );
  }

  const isOwner = Boolean(user && plan.user && (user.id === plan.user || user.clerk_id === plan.user));
  const items: StudyPlanItem[] = plan.items || [];

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    toast.success("Copied public share link!");
  };

  const handleTogglePrivacy = async () => {
    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        data: { is_public: !plan.is_public },
      });
      toast.success(
        plan.is_public
          ? "Study plan is now private."
          : "Study plan is now public and shareable."
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update visibility.");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        data: { title: newTitle.trim() },
      });
      toast.success("Study plan renamed successfully.");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to rename study plan.");
    }
  };

  const handleDeletePlan = async () => {
    try {
      await deleteMutation.mutateAsync(plan.id);
      toast.success("Study plan deleted.");
      router.push("/study-plans");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete study plan.");
    }
  };

  const handleRemoveLesson = async (itemId: string, lessonTitle?: string) => {
    setRemovingItemId(itemId);
    try {
      await removeMutation.mutateAsync({
        planId: plan.id,
        itemId,
      });
      toast.success(`Removed ${lessonTitle || "lesson"} from study plan.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove lesson.");
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/study-plans"
          className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to study plans
        </Link>
      </div>

      {/* Header Container */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink truncate">
                {plan.title || (plan as any).name || "Untitled Study Plan"}
              </h1>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle(plan.title || (plan as any).name || "");
                    setEditOpen(true);
                  }}
                  className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-muted transition"
                  title="Rename Plan"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>Created {formatDate(plan.created_at)}</span>
              <span>·</span>
              <span>{items.length} {items.length === 1 ? "lesson" : "lessons"} in curriculum</span>
              <span>·</span>
              <Badge variant={plan.is_public ? "default" : "outline"} className="gap-1 text-[11px]">
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

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePrivacy}
                disabled={updateMutation.isPending}
                className="gap-1.5 text-xs"
              >
                {plan.is_public ? (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Make Private
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" /> Make Public
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs"
              title="Copy link to this study plan"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>

            {isOwner && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="gap-1.5 text-xs"
                title="Delete this study plan"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sequential Playlist */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card/40 p-10 text-center sm:p-14">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">No lessons in this study plan yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted leading-relaxed">
            Browse published lessons across the platform and click &quot;Add to Study Plan&quot; to curate your sequential curriculum.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              nativeButton={false}
              render={<Link href="/lessons" />}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Browse Lessons
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="font-display font-semibold text-base text-ink">
              Sequential Learning Progression ({items.length} {items.length === 1 ? "Item" : "Items"})
            </h2>
            <span className="text-xs text-ink-muted">
              Step-by-step syllabus playlist
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const stepNumber = String(index + 1).padStart(2, "0");
              const isRemoving = removingItemId === item.id;

              const isLesson = Boolean(item.lesson || item.item_type === "LESSON" || item.lesson_details);
              const isProblem = Boolean(item.problem || item.item_type === "PROBLEM" || item.problem_details);
              const isSolution = Boolean(item.solution || item.item_type === "SOLUTION" || item.solution_details);
              const isResource = Boolean(item.resource || item.item_type === "RESOURCE" || item.resource_details);

              let itemTitle = "Curriculum Item";
              let itemHref = "#";
              let typeBadge = "Lesson";
              let actionLabel = "Study";
              let badgeStyle = "border-amber-500/30 text-amber-600 bg-amber-500/5";
              let subjectName: string | undefined;
              let levelName: string | undefined;
              let authorName: string | undefined;

              if (isProblem) {
                const problem = item.problem_details || (typeof item.problem === "object" ? (item.problem as any) : null);
                const problemId = problem?.id || (typeof item.problem === "string" ? item.problem : "");
                itemTitle = problem?.title || `Problem ${problemId.slice(0, 8)}`;
                itemHref = `/problems/${problemId}`;
                typeBadge = "Problem";
                actionLabel = "Solve!";
                badgeStyle = "border-indigo-500/30 text-indigo-600 bg-indigo-500/5";
                subjectName = problem?.subject_details?.name;
                levelName = problem?.level_details?.name;
                authorName = problem?.author_details?.display_name;
              } else if (isSolution) {
                const solution = item.solution_details || (typeof item.solution === "object" ? (item.solution as any) : null);
                const solutionId = solution?.id || (typeof item.solution === "string" ? item.solution : "");
                const problemId = solution?.problem || "";
                itemTitle = solution?.body ? `Solution: ${solution.body.slice(0, 60)}...` : `Solution ${solutionId.slice(0, 8)}`;
                itemHref = `/problems/${problemId}/solutions/${solutionId}`;
                typeBadge = "Worked Solution";
                actionLabel = "Solution";
                badgeStyle = "border-emerald-500/30 text-emerald-600 bg-emerald-500/5";
                authorName = solution?.author_details?.display_name;
              } else if (isResource) {
                const resource = item.resource_details || (typeof item.resource === "object" ? (item.resource as any) : null);
                const resourceId = resource?.id || (typeof item.resource === "string" ? item.resource : "");
                itemTitle = resource?.file_name || `Resource ${resourceId.slice(0, 8)}`;
                itemHref = resource?.resource_type === "PAST_PAPER" ? `/train/${resourceId}` : (resource?.download_url || resource?.file_url || `/resources`);
                typeBadge = resource?.resource_type === "PAST_PAPER" ? "Past Paper" : "Textbook";
                actionLabel = resource?.resource_type === "PAST_PAPER" ? "Train!" : "Open";
                badgeStyle = "border-blue-500/30 text-blue-600 bg-blue-500/5";
                subjectName = resource?.subject_details?.name;
                levelName = resource?.level_details?.name;
              } else {
                const lesson = item.lesson_details || (typeof item.lesson === "object" ? (item.lesson as any) : null);
                const lessonId = lesson?.id || (typeof item.lesson === "string" ? item.lesson : "");
                itemTitle = lesson?.title || `Lesson ${lessonId.slice(0, 8)}`;
                itemHref = `/lessons/${lessonId}`;
                typeBadge = "Lesson";
                actionLabel = "Study";
                badgeStyle = "border-amber-500/30 text-amber-600 bg-amber-500/5";
                subjectName = lesson?.subject_details?.name;
                levelName = lesson?.level_details?.name;
                authorName = lesson?.author_details?.display_name;
              }

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5 transition-all hover:border-brand/40 hover:shadow-xs"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0 pr-2">
                    {/* Step Number Index */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-display font-bold text-sm text-brand">
                      {stepNumber}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase", badgeStyle)}>
                          {typeBadge}
                        </Badge>
                      </div>

                      <Link
                        href={itemHref}
                        className="font-display font-semibold text-base text-ink hover:text-brand hover:underline transition truncate block"
                      >
                        {itemTitle}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        {subjectName && (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {subjectName}
                          </Badge>
                        )}
                        {levelName && (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {levelName}
                          </Badge>
                        )}
                        {authorName && (
                          <span>By {authorName}</span>
                        )}
                        <span>·</span>
                        <span>Added {formatDate(item.added_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 text-brand hover:text-brand"
                      nativeButton={false}
                      render={<Link href={itemHref} />}
                    >
                      <span>{actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLesson(item.id, itemTitle)}
                        disabled={isRemoving}
                        className="p-2 rounded-lg text-ink-muted hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                        title="Remove item from plan"
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Study Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 pt-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Study plan title"
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newTitle.trim() || updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Study Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{plan.title || (plan as any).name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlan}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
