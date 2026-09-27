"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Plus,
  Loader2,
  Lock,
  Globe,
  Check,
} from "lucide-react";
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
  useSavedSessions,
  useAddSessionItem,
  useRemoveSessionItem,
  useCreateSavedSession,
  useStudyPlans,
  useAddStudyPlanItem,
  useRemoveStudyPlanItem,
  useCreateStudyPlan,
} from "@/hooks/use-collections";
import type { SaveTargetType, SavedSession, StudyPlan } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SaveButtonProps {
  entityType: SaveTargetType;
  entityId: string;
  variant?: "default" | "secondary" | "ghost" | "outline" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
  label?: string;
  defaultTab?: "session" | "plan";
}

export function SaveButton({
  entityType,
  entityId,
  variant = "ghost",
  size = "sm",
  className,
  showLabel = false,
  label = "Save",
  defaultTab,
}: SaveButtonProps) {
  const [open, setOpen] = useState(false);

  // Tab switcher: 'session' | 'plan'
  // Posts can only be saved to Sessions. Lessons, problems, solutions, and resources can be saved to both.
  const canSaveToPlan = entityType !== "post";
  const [activeTab, setActiveTab] = useState<"session" | "plan">(
    defaultTab || "session"
  );

  // Sessions state
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [togglingSessionId, setTogglingSessionId] = useState<string | null>(null);

  // Study plans state
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const { isSignedIn } = useAuth();
  const isAuthed =
    isSignedIn ||
    (typeof window !== "undefined" &&
      Boolean(localStorage.getItem("dev_token")));

  // Saved Sessions queries/mutations
  const { data: sessionsResponse, isLoading: isSessionsLoading } =
    useSavedSessions();
  const addSessionMutation = useAddSessionItem();
  const removeSessionMutation = useRemoveSessionItem();
  const createSessionMutation = useCreateSavedSession();
  const sessions: SavedSession[] = sessionsResponse?.data || [];

  // Study Plans queries/mutations
  const { data: plansResponse, isLoading: isPlansLoading } = useStudyPlans();
  const addPlanMutation = useAddStudyPlanItem();
  const removePlanMutation = useRemoveStudyPlanItem();
  const createPlanMutation = useCreateStudyPlan();
  const plans: StudyPlan[] = plansResponse?.data || [];

  // Helper: check if item is in a session
  const getItemInSession = (session: SavedSession) => {
    return session.items?.find((item) => {
      if (entityType === "post") {
        return item.post === entityId || item.post_details?.id === entityId;
      }
      if (entityType === "problem") {
        return item.problem === entityId || item.problem_details?.id === entityId;
      }
      if (entityType === "solution") {
        return item.solution === entityId || item.solution_details?.id === entityId;
      }
      if (entityType === "lesson") {
        return item.lesson === entityId || item.lesson_details?.id === entityId;
      }
      if (entityType === "resource") {
        return item.resource === entityId || item.resource_details?.id === entityId;
      }
      return false;
    });
  };

  // Helper: check if item is in a study plan
  const getItemInPlan = (plan: StudyPlan) => {
    return plan.items?.find((item) => {
      if (entityType === "lesson") {
        return item.lesson === entityId || item.lesson_details?.id === entityId;
      }
      if (entityType === "problem") {
        return item.problem === entityId || item.problem_details?.id === entityId;
      }
      if (entityType === "solution") {
        return item.solution === entityId || item.solution_details?.id === entityId;
      }
      if (entityType === "resource") {
        return item.resource === entityId || item.resource_details?.id === entityId;
      }
      return false;
    });
  };

  const isSavedInAnySession = sessions.some((s) => Boolean(getItemInSession(s)));
  const isSavedInAnyPlan = plans.some((p) => Boolean(getItemInPlan(p)));
  const isSaved = isSavedInAnySession || (canSaveToPlan && isSavedInAnyPlan);

  const sessionCount = sessions.length;
  const isSessionAtCap = sessionCount >= 12;

  const planCount = plans.length;
  const isPlanAtCap = planCount >= 12;

  // Toggle Session Item
  const handleToggleSession = async (session: SavedSession) => {
    const existingItem = getItemInSession(session);
    setTogglingSessionId(session.id);

    try {
      if (existingItem) {
        await removeSessionMutation.mutateAsync({
          sessionId: session.id,
          itemId: existingItem.id,
        });
        toast.success(`Removed from "${session.title}"`);
      } else {
        await addSessionMutation.mutateAsync({
          sessionId: session.id,
          target: { [entityType]: entityId },
        });
        toast.success(`Saved to "${session.title}"`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update session item.");
    } finally {
      setTogglingSessionId(null);
    }
  };

  // Toggle Study Plan Item
  const handleTogglePlan = async (plan: StudyPlan) => {
    const existingItem = getItemInPlan(plan);
    setTogglingPlanId(plan.id);

    try {
      if (existingItem) {
        await removePlanMutation.mutateAsync({
          planId: plan.id,
          itemId: existingItem.id,
        });
        toast.success(`Removed from "${plan.title}"`);
      } else {
        await addPlanMutation.mutateAsync({
          planId: plan.id,
          target: { [entityType]: entityId },
        });
        toast.success(`Added to "${plan.title}"`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update study plan.");
    } finally {
      setTogglingPlanId(null);
    }
  };

  // Create new session & save
  const handleCreateSessionAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim() || isSessionAtCap) return;

    setIsCreatingSession(true);
    try {
      const newSession = await createSessionMutation.mutateAsync({
        title: newSessionTitle.trim(),
        is_public: false,
      });

      await addSessionMutation.mutateAsync({
        sessionId: newSession.id,
        target: { [entityType]: entityId },
      });

      toast.success(`Created "${newSession.title}" and saved item!`);
      setNewSessionTitle("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create session and save item.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Create new plan & save
  const handleCreatePlanAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim() || isPlanAtCap) return;

    setIsCreatingPlan(true);
    try {
      const newPlan = await createPlanMutation.mutateAsync({
        title: newPlanTitle.trim(),
        is_public: false,
      });

      await addPlanMutation.mutateAsync({
        planId: newPlan.id,
        target: { [entityType]: entityId },
      });

      toast.success(`Created "${newPlan.title}" and added to plan!`);
      setNewPlanTitle("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create study plan.");
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const buttonVariant = variant === "icon" ? "ghost" : variant;
  const buttonSize = variant === "icon" ? "icon" : size;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className={cn(
              "transition-colors",
              isSaved && "text-brand hover:text-brand",
              className
            )}
            title={isSaved ? "Saved in collections" : "Save item"}
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        {isSaved ? (
          <BookmarkCheck className="h-4 w-4 fill-current text-brand" />
        ) : (
          <Bookmark className="h-4 w-4 text-ink-muted transition group-hover:text-ink" />
        )}
        {showLabel && (
          <span className="ml-1.5">{isSaved ? "Saved" : label}</span>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 font-display text-base">
              {activeTab === "plan" ? (
                <BookOpen className="h-4 w-4 text-brand" />
              ) : (
                <Bookmark className="h-4 w-4 text-brand" />
              )}
              {canSaveToPlan
                ? activeTab === "plan"
                  ? "Add to Study Plan"
                  : "Save to Session"
                : "Save to Session"}
            </DialogTitle>

            <Badge variant="outline" className="text-xs">
              {activeTab === "plan"
                ? `${planCount} / 12 Plans`
                : `${sessionCount} / 12 Sessions`}
            </Badge>
          </div>

          <DialogDescription className="text-xs text-ink-muted">
            {activeTab === "plan"
              ? "Curate into structured, sequential syllabi and study plans."
              : "Bookmark for later reference across your saved collections."}
          </DialogDescription>

          {/* Tab Switcher for Lessons, Solve, and Resources */}
          {canSaveToPlan && (
            <div className="mt-3 flex rounded-xl border border-line bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("session")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "session"
                    ? "bg-card text-ink shadow-xs"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Saved Sessions</span>
                {isSavedInAnySession && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("plan")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "plan"
                    ? "bg-card text-ink shadow-xs"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Study Plans</span>
                {isSavedInAnyPlan && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </button>
            </div>
          )}
        </DialogHeader>

        {!isAuthed ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="mb-4 text-sm text-ink-muted">
              Please sign in to save items to your collections.
            </p>
            <Button nativeButton={false} render={<Link href="/sign-in" />}>
              Sign In
            </Button>
          </div>
        ) : activeTab === "session" ? (
          /* ======================================================== */
          /* SAVED SESSIONS TAB                                       */
          /* ======================================================== */
          <div className="flex flex-col gap-4 py-2">
            {isSessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-xs text-ink-muted">
                  You have not created any saved sessions yet.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {sessions.map((session) => {
                  const isItemInSession = Boolean(getItemInSession(session));
                  const isToggling = togglingSessionId === session.id;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => handleToggleSession(session)}
                      disabled={isToggling}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition cursor-pointer",
                        isItemInSession
                          ? "border-brand/50 bg-brand/5 text-ink"
                          : "border-line bg-card hover:border-line-strong hover:bg-muted/50 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                            isItemInSession
                              ? "border-brand bg-brand text-white"
                              : "border-line bg-background"
                          )}
                        >
                          {isItemInSession && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
                        </div>
                        <span className="truncate font-medium">
                          {session.title || (session as any).name || "Untitled Session"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-ink-muted">
                        <span className="text-[11px]">
                          {session.items?.length || 0} items
                        </span>
                        {session.is_public ? (
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

            {/* Inline New Session Form */}
            <div className="border-t border-line pt-3">
              {isSessionAtCap ? (
                <p className="text-center text-xs text-ink-muted">
                  Maximum limit of 12 saved sessions reached.
                </p>
              ) : (
                <form onSubmit={handleCreateSessionAndSave} className="flex gap-2">
                  <Input
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="Create new session..."
                    className="h-8 text-xs"
                    disabled={isCreatingSession || isSessionsLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 shrink-0 text-xs gap-1"
                    disabled={
                      isCreatingSession ||
                      !newSessionTitle.trim() ||
                      isSessionsLoading
                    }
                  >
                    {isCreatingSession ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Save
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STUDY PLANS TAB                                          */
          /* ======================================================== */
          <div className="flex flex-col gap-4 py-2">
            {isPlansLoading ? (
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
                        "w-full flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition cursor-pointer",
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
                          {isItemInPlan && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
                        </div>
                        <span className="truncate font-medium">
                          {plan.title || (plan as any).name || "Untitled Plan"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-ink-muted">
                        <span className="text-[11px]">
                          {plan.items?.length || 0} items
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

            {/* Inline New Plan Form */}
            <div className="border-t border-line pt-3">
              {isPlanAtCap ? (
                <p className="text-center text-xs text-ink-muted">
                  Maximum limit of 12 study plans reached.
                </p>
              ) : (
                <form onSubmit={handleCreatePlanAndSave} className="flex gap-2">
                  <Input
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    placeholder="Create new study plan..."
                    className="h-8 text-xs"
                    disabled={isCreatingPlan || isPlansLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 shrink-0 text-xs gap-1"
                    disabled={
                      isCreatingPlan || !newPlanTitle.trim() || isPlansLoading
                    }
                  >
                    {isCreatingPlan ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Save
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
