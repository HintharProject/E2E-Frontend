"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { BookOpen, Plus, Loader2, Lock, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useStudyPlans,
  useAddStudyPlanItem,
  useRemoveStudyPlanItem,
  useCreateStudyPlan,
} from "@/hooks/use-collections";
import type { StudyPlan } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SaveToStudyPlanDialog({
  lessonId,
  variant = "secondary",
  size = "default",
  showLabel = true,
}: {
  lessonId: string;
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const { isSignedIn } = useAuth();
  const { data: plansResponse, isLoading } = useStudyPlans();
  const addMutation = useAddStudyPlanItem();
  const removeMutation = useRemoveStudyPlanItem();
  const createMutation = useCreateStudyPlan();

  const plans: StudyPlan[] = plansResponse?.data || [];

  const getItemInPlan = (plan: StudyPlan) => {
    return plan.items?.find((item) => item.lesson === lessonId || (item as any).lesson_details?.id === lessonId);
  };

  const isSavedInAnyPlan = plans.some((plan) => Boolean(getItemInPlan(plan)));
  const planCount = plans.length;
  const isAtCapacity = planCount >= 12;

  const handleTogglePlan = async (plan: StudyPlan) => {
    const existingItem = getItemInPlan(plan);
    setTogglingPlanId(plan.id);

    try {
      if (existingItem) {
        await removeMutation.mutateAsync({
          planId: plan.id,
          itemId: existingItem.id,
        });
        toast.success(`Removed from "${plan.title}"`);
      } else {
        await addMutation.mutateAsync({
          planId: plan.id,
          lessonId,
        });
        toast.success(`Added to "${plan.title}"`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update study plan.");
    } finally {
      setTogglingPlanId(null);
    }
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim() || isAtCapacity) return;

    setIsCreatingNew(true);
    try {
      const newPlan = await createMutation.mutateAsync({
        title: newPlanTitle.trim(),
        is_public: false,
      });

      await addMutation.mutateAsync({
        planId: newPlan.id,
        lessonId,
      });

      toast.success(`Created "${newPlan.title}" and added lesson!`);
      setNewPlanTitle("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create study plan.");
    } finally {
      setIsCreatingNew(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={variant}
            size={size}
            className={cn(isSavedInAnyPlan && "text-brand hover:text-brand")}
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <BookOpen className="h-4 w-4" />
        {showLabel && <span className="ml-1.5">{isSavedInAnyPlan ? "In Study Plan" : "Add to Study Plan"}</span>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 font-display text-base">
              <BookOpen className="h-4 w-4 text-brand" />
              Add to Study Plan
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              {planCount} / 12 Plans
            </Badge>
          </div>
          <DialogDescription className="text-xs text-ink-muted">
            Add this lesson to an existing study plan or create a new curriculum playlist.
          </DialogDescription>
        </DialogHeader>

        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="mb-4 text-sm text-ink-muted">
              Please sign in to add lessons to your study plans.
            </p>
            <Button nativeButton={false} render={<Link href="/sign-in" />}>
              Sign In
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
              </div>
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-xs text-ink-muted">
                  You have not created any study plans yet.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {plans.map((plan) => {
                  const isItemInPlan = Boolean(getItemInPlan(plan));
                  const isToggling = togglingPlanId === plan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleTogglePlan(plan)}
                      disabled={isToggling}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition",
                        isItemInPlan
                          ? "border-brand/50 bg-brand/5 text-ink"
                          : "border-line bg-card hover:border-line-strong hover:bg-muted/50 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                            isItemInPlan
                              ? "border-brand bg-brand text-white"
                              : "border-line bg-background"
                          )}
                        >
                          {isItemInPlan && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="truncate font-medium">
                          {plan.title || plan.name || "Untitled Plan"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-ink-muted">
                        <span className="text-[11px]">
                          {plan.items?.length || 0} lessons
                        </span>
                        {plan.is_public ? (
                          <span title="Public">
                            <Globe className="h-3.5 w-3.5 text-ink-muted" />
                          </span>
                        ) : (
                          <span title="Private">
                            <Lock className="h-3.5 w-3.5 text-ink-muted" />
                          </span>
                        )}
                        {isToggling && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-line pt-3">
              {isAtCapacity ? (
                <p className="text-center text-xs text-ink-muted">
                  Maximum limit of 12 study plans reached.
                </p>
              ) : (
                <form onSubmit={handleCreateAndSave} className="flex gap-2">
                  <Input
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    placeholder="Create new study plan..."
                    className="h-8 text-xs"
                    disabled={isCreatingNew || isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 shrink-0 text-xs gap-1"
                    disabled={isCreatingNew || !newPlanTitle.trim() || isLoading}
                  >
                    {isCreatingNew ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
