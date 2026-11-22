"use client";

import { useState } from "react";
import { useDevToken } from "@/lib/client-auth";
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
import { useOptionalSavedCollectionsLookup } from "@/components/providers/saved-collections-provider";
import type {
  SaveTargetType,
  SavedSession,
  SavedSessionItem,
  StudyPlan,
  StudyPlanItem,
} from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MAX_SAVED_SESSIONS, MAX_STUDY_PLANS } from "@/lib/constants";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

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

function getCollectionItem(
  items: Array<SavedSessionItem | StudyPlanItem> | undefined,
  entityType: SaveTargetType,
  entityId: string
) {
  return items?.find((item) => {
    if (entityType === "post" && "post" in item) {
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
}

interface CollectionListPanelProps<T extends { id: string; title: string; name?: string; is_public: boolean; items: Array<SavedSessionItem | StudyPlanItem> }> {
  collections: T[];
  isLoading: boolean;
  togglingId: string | null;
  isAtCap: boolean;
  entityType: SaveTargetType;
  entityId: string;
  emptyText: string;
  capText: string;
  untitledLabel: string;
  inputPlaceholder: string;
  newTitle: string;
  isCreating: boolean;
  onNewTitleChange: (value: string) => void;
  onToggle: (collection: T) => void;
  onCreateAndSave: (e: React.FormEvent) => void;
}

function CollectionListPanel<
  T extends {
    id: string;
    title: string;
    name?: string;
    is_public: boolean;
    items: Array<SavedSessionItem | StudyPlanItem>;
  },
>({
  collections,
  isLoading,
  togglingId,
  isAtCap,
  entityType,
  entityId,
  emptyText,
  capText,
  untitledLabel,
  inputPlaceholder,
  newTitle,
  isCreating,
  onNewTitleChange,
  onToggle,
  onCreateAndSave,
}: CollectionListPanelProps<T>) {
  return (
    <div className="flex flex-col gap-4 py-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {collections.map((collection) => {
            const isItemPresent = Boolean(
              getCollectionItem(collection.items, entityType, entityId)
            );
            const isToggling = togglingId === collection.id;

            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => onToggle(collection)}
                disabled={isToggling}
                className={cn(
                  "w-full min-h-[44px] sm:min-h-0 flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition cursor-pointer",
                  isItemPresent
                    ? "border-primary/50 bg-primary/5 text-foreground"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                      isItemPresent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                  >
                    {isItemPresent && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="truncate font-medium">
                    {collection.title || collection.name || untitledLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                  <span className="font-mono text-xs tabular-nums">
                    {collection.items?.length || 0} items
                  </span>
                  {collection.is_public ? (
                    <span title="Public">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  ) : (
                    <span title="Private">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  )}
                  {isToggling && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="border-t border-border pt-3">
        {isAtCap ? (
          <p className="text-center text-xs text-muted-foreground">{capText}</p>
        ) : (
          <form onSubmit={onCreateAndSave} className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => onNewTitleChange(e.target.value)}
              placeholder={inputPlaceholder}
              className="h-9 sm:h-8 text-base sm:text-xs"
              disabled={isCreating || isLoading}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 sm:h-8 shrink-0 text-xs gap-1"
              disabled={isCreating || !newTitle.trim() || isLoading}
            >
              {isCreating ? (
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
  );
}

interface SaveCollectionsDialogProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  entityType: SaveTargetType;
  entityId: string;
  canSaveToPlan: boolean;
  defaultTab?: "session" | "plan";
  initialSavedInSession?: boolean;
  initialSavedInPlan?: boolean;
}

function SaveCollectionsDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  canSaveToPlan,
  defaultTab,
  initialSavedInSession = false,
  initialSavedInPlan = false,
}: SaveCollectionsDialogProps) {
  const [activeTab, setActiveTab] = useState<"session" | "plan">(
    canSaveToPlan &&
      (defaultTab === "plan" || (!defaultTab && initialSavedInPlan && !initialSavedInSession))
      ? "plan"
      : "session"
  );

  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [togglingSessionId, setTogglingSessionId] = useState<string | null>(
    null
  );

  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const { requireAuth } = useAuthGate();

  const { data: sessionsResponse, isLoading: isSessionsLoading } =
    useSavedSessions({ enabled: open });
  const addSessionMutation = useAddSessionItem();
  const removeSessionMutation = useRemoveSessionItem();
  const createSessionMutation = useCreateSavedSession();
  const sessions: SavedSession[] = sessionsResponse?.data || [];

  const { data: plansResponse, isLoading: isPlansLoading } = useStudyPlans({
    enabled: open && canSaveToPlan,
  });
  const addPlanMutation = useAddStudyPlanItem();
  const removePlanMutation = useRemoveStudyPlanItem();
  const createPlanMutation = useCreateStudyPlan();
  const plans: StudyPlan[] = canSaveToPlan ? plansResponse?.data || [] : [];

  const effectiveTab = canSaveToPlan ? activeTab : "session";

  const isSavedInAnySession = sessions.some((s) =>
    Boolean(getCollectionItem(s.items, entityType, entityId))
  );
  const isSavedInAnyPlan =
    canSaveToPlan &&
    plans.some((p) =>
      Boolean(getCollectionItem(p.items, entityType, entityId))
    );

  const sessionCount = sessions.length;
  const isSessionAtCap = sessionCount >= MAX_SAVED_SESSIONS;

  const planCount = plans.length;
  const isPlanAtCap = planCount >= MAX_STUDY_PLANS;

  const handleUnauthorizedError = (err: unknown, fallbackMessage: string) => {
    const status = (err as { status?: number } | null)?.status;
    const message = (err as { message?: string } | null)?.message;
    if (status === 401 || message === "Unauthorized") {
      onOpenChange(false);
      requireAuth(undefined, { actionLabel: "save items to your library" });
      return;
    }
    toast.error(message || fallbackMessage);
  };

  const handleToggleSession = async (session: SavedSession) => {
    if (!requireAuth(undefined, { actionLabel: "save items to your library" })) {
      onOpenChange(false);
      return;
    }
    const existingItem = getCollectionItem(session.items, entityType, entityId);
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
    } catch (err: unknown) {
      handleUnauthorizedError(err, "Failed to update session item.");
    } finally {
      setTogglingSessionId(null);
    }
  };

  const handleTogglePlan = async (plan: StudyPlan) => {
    if (!requireAuth(undefined, { actionLabel: "save items to your library" })) {
      onOpenChange(false);
      return;
    }
    const existingItem = getCollectionItem(plan.items, entityType, entityId);
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
    } catch (err: unknown) {
      handleUnauthorizedError(err, "Failed to update study plan.");
    } finally {
      setTogglingPlanId(null);
    }
  };

  const handleCreateSessionAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth(undefined, { actionLabel: "save items to your library" })) {
      onOpenChange(false);
      return;
    }
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
    } catch (err: unknown) {
      handleUnauthorizedError(err, "Failed to create session and save item.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleCreatePlanAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth(undefined, { actionLabel: "save items to your library" })) {
      onOpenChange(false);
      return;
    }
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
    } catch (err: unknown) {
      handleUnauthorizedError(err, "Failed to create study plan.");
    } finally {
      setIsCreatingPlan(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 font-heading text-base">
              {effectiveTab === "plan" ? (
                <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
              {effectiveTab === "plan" ? "Add to Study Plan" : "Save to Session"}
            </DialogTitle>

            <Badge variant="outline" className="font-mono tabular-nums text-xs">
              {effectiveTab === "plan"
                ? `${planCount} / ${MAX_STUDY_PLANS} Plans`
                : `${sessionCount} / ${MAX_SAVED_SESSIONS} Sessions`}
            </Badge>
          </div>

          <DialogDescription className="text-xs text-muted-foreground">
            {canSaveToPlan
              ? "Choose between quick Saved Sessions and ordered Study Plans."
              : "Saved Sessions are quick bookmarks for revisiting forum posts later."}
          </DialogDescription>

          {canSaveToPlan && (
            <div
              role="tablist"
              aria-label="Save collection type"
              className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={effectiveTab === "session"}
                onClick={() => setActiveTab("session")}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg min-h-[44px] px-2.5 py-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  effectiveTab === "session"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <span className="flex w-full items-center justify-between gap-1.5 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>Saved Sessions</span>
                  </span>
                  {isSavedInAnySession && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium leading-none text-primary">
                      Saved
                    </span>
                  )}
                </span>
                <span className="text-xs font-normal text-muted-foreground leading-tight">
                  Quick bookmarks
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={effectiveTab === "plan"}
                onClick={() => setActiveTab("plan")}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg min-h-[44px] px-2.5 py-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  effectiveTab === "plan"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <span className="flex w-full items-center justify-between gap-1.5 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>Study Plans</span>
                  </span>
                  {isSavedInAnyPlan && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium leading-none text-primary">
                      Saved
                    </span>
                  )}
                </span>
                <span className="text-xs font-normal text-muted-foreground leading-tight">
                  Ordered syllabus path
                </span>
              </button>
            </div>
          )}
        </DialogHeader>

        {effectiveTab === "session" ? (
          <CollectionListPanel
            collections={sessions}
            isLoading={isSessionsLoading}
            togglingId={togglingSessionId}
            isAtCap={isSessionAtCap}
            entityType={entityType}
            entityId={entityId}
            emptyText="You have not created any saved sessions yet."
            capText={`Maximum limit of ${MAX_SAVED_SESSIONS} saved sessions reached.`}
            untitledLabel="Untitled Session"
            inputPlaceholder="Create new session..."
            newTitle={newSessionTitle}
            isCreating={isCreatingSession}
            onNewTitleChange={setNewSessionTitle}
            onToggle={handleToggleSession}
            onCreateAndSave={handleCreateSessionAndSave}
          />
        ) : (
          <CollectionListPanel
            collections={plans}
            isLoading={isPlansLoading}
            togglingId={togglingPlanId}
            isAtCap={isPlanAtCap}
            entityType={entityType}
            entityId={entityId}
            emptyText="You have not created any study plans yet."
            capText={`Maximum limit of ${MAX_STUDY_PLANS} study plans reached.`}
            untitledLabel="Untitled Plan"
            inputPlaceholder="Create new study plan..."
            newTitle={newPlanTitle}
            isCreating={isCreatingPlan}
            onNewTitleChange={setNewPlanTitle}
            onToggle={handleTogglePlan}
            onCreateAndSave={handleCreatePlanAndSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SaveButtonShellProps extends SaveButtonProps {
  isSavedInSession: boolean;
  isSavedInPlan: boolean;
  canSaveToPlan: boolean;
}

function SaveButtonShell({
  entityType,
  entityId,
  variant = "ghost",
  size = "sm",
  className,
  showLabel = false,
  label = "Save",
  defaultTab,
  isSavedInSession,
  isSavedInPlan,
  canSaveToPlan,
}: SaveButtonShellProps) {
  const [open, setOpen] = useState(false);
  const { isSignedIn: isGateSignedIn, requireAuth } = useAuthGate();
  const devToken = useDevToken();
  const isAuthed = Boolean(isGateSignedIn || devToken);
  const isSaved = isSavedInSession || isSavedInPlan;

  const buttonVariant = variant === "icon" ? "ghost" : variant;
  const buttonSize = variant === "icon" ? "icon" : size;

  const savedWhereLabel =
    isSavedInSession && isSavedInPlan
      ? "In Session & Plan"
      : isSavedInPlan
        ? "In Study Plan"
        : isSavedInSession
          ? canSaveToPlan
            ? "In Session"
            : "Saved"
          : label;

  const unsavedLabel = canSaveToPlan
    ? "Save to Session (quick bookmark) or Study Plan (ordered study)"
    : "Save to Saved Session (quick bookmark)";
  const savedLabel =
    isSavedInSession && isSavedInPlan
      ? "Saved in Session & Study Plan — manage collections"
      : isSavedInPlan
        ? "Saved in Study Plan — manage Sessions or Study Plans"
        : isSavedInSession
          ? canSaveToPlan
            ? "Saved in Session — manage Sessions or Study Plans"
            : "Saved in Sessions — manage Saved Sessions"
          : unsavedLabel;

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthed) {
      requireAuth(undefined, { actionLabel: "save items to your library" });
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={cn(
          "transition-colors",
          isAuthed && isSaved && "text-primary hover:text-primary",
          className
        )}
        aria-label={isAuthed && isSaved ? savedLabel : unsavedLabel}
        aria-pressed={isAuthed ? isSaved : false}
        title={isAuthed && isSaved ? savedLabel : unsavedLabel}
        onClick={handleTriggerClick}
      >
        {isAuthed && isSaved ? (
          <BookmarkCheck
            className="h-4 w-4 fill-current text-primary"
            aria-hidden="true"
          />
        ) : (
          <Bookmark
            className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground"
            aria-hidden="true"
          />
        )}
        {showLabel && (
          <span className="ml-1.5">
            {isAuthed && isSaved ? savedWhereLabel : label}
          </span>
        )}
      </Button>

      {open && isAuthed && (
        <SaveCollectionsDialog
          open={open}
          onOpenChange={setOpen}
          entityType={entityType}
          entityId={entityId}
          canSaveToPlan={canSaveToPlan}
          defaultTab={defaultTab}
          initialSavedInSession={isSavedInSession}
          initialSavedInPlan={isSavedInPlan}
        />
      )}
    </>
  );
}

function SaveButtonStandalone(props: SaveButtonProps) {
  const canSaveToPlan = props.entityType !== "post";
  const { data: sessionsResponse } = useSavedSessions();
  const { data: plansResponse } = useStudyPlans({ enabled: canSaveToPlan });

  const isSavedInSession = (sessionsResponse?.data || []).some((s) =>
    Boolean(getCollectionItem(s.items, props.entityType, props.entityId))
  );
  const isSavedInPlan =
    canSaveToPlan &&
    (plansResponse?.data || []).some((p) =>
      Boolean(getCollectionItem(p.items, props.entityType, props.entityId))
    );

  return (
    <SaveButtonShell
      {...props}
      isSavedInSession={isSavedInSession}
      isSavedInPlan={isSavedInPlan}
      canSaveToPlan={canSaveToPlan}
    />
  );
}

/**
 * Bookmark trigger and modal for Saved Sessions and Study Plans.
 * Reads saved status from the shared SavedCollectionsProvider when mounted in the app shell,
 * and lazily mounts dialog queries and mutations only when opened.
 */
export function SaveButton(props: SaveButtonProps) {
  const sharedLookup = useOptionalSavedCollectionsLookup();
  const canSaveToPlan = props.entityType !== "post";

  if (!sharedLookup) {
    return <SaveButtonStandalone {...props} />;
  }

  return (
    <SaveButtonShell
      {...props}
      isSavedInSession={sharedLookup.isSavedInSession(props.entityType, props.entityId)}
      isSavedInPlan={sharedLookup.isSavedInPlan(props.entityType, props.entityId)}
      canSaveToPlan={canSaveToPlan}
    />
  );
}
