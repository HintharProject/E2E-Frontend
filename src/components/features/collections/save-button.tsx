"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Bookmark, BookmarkCheck, Plus, Loader2, Lock, Globe, Check } from "lucide-react";
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
} from "@/hooks/use-collections";
import type { SaveTargetType, SavedSession } from "@/types";
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
}

export function SaveButton({
  entityType,
  entityId,
  variant = "ghost",
  size = "sm",
  className,
  showLabel = false,
  label = "Save",
}: SaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [togglingSessionId, setTogglingSessionId] = useState<string | null>(null);

  const { isSignedIn } = useAuth();
  const { data: sessionsResponse, isLoading } = useSavedSessions();
  const addMutation = useAddSessionItem();
  const removeMutation = useRemoveSessionItem();
  const createMutation = useCreateSavedSession();

  const sessions: SavedSession[] = sessionsResponse?.data || [];

  // Helper to find whether this item exists in a given session
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

  const isSavedInAnySession = sessions.some((session) => Boolean(getItemInSession(session)));
  const sessionCount = sessions.length;
  const isAtCapacity = sessionCount >= 12;

  const handleToggleSession = async (session: SavedSession) => {
    const existingItem = getItemInSession(session);
    setTogglingSessionId(session.id);

    try {
      if (existingItem) {
        await removeMutation.mutateAsync({
          sessionId: session.id,
          itemId: existingItem.id,
        });
        toast.success(`Removed from "${session.title}"`);
      } else {
        await addMutation.mutateAsync({
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

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim() || isAtCapacity) return;

    setIsCreatingNew(true);
    try {
      const newSession = await createMutation.mutateAsync({
        title: newSessionTitle.trim(),
        is_public: false,
      });

      await addMutation.mutateAsync({
        sessionId: newSession.id,
        target: { [entityType]: entityId },
      });

      toast.success(`Created "${newSession.title}" and saved item!`);
      setNewSessionTitle("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create session and save item.");
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Determine button styles
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
              isSavedInAnySession && "text-brand hover:text-brand",
              className
            )}
            title={isSavedInAnySession ? "Saved in collections" : "Save to session"}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        }
      >
        {isSavedInAnySession ? (
          <BookmarkCheck className="h-4 w-4 fill-current text-brand" />
        ) : (
          <Bookmark className="h-4 w-4 text-ink-muted transition group-hover:text-ink" />
        )}
        {showLabel && <span className="ml-1.5">{isSavedInAnySession ? "Saved" : label}</span>}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 font-display text-base">
              <Bookmark className="h-4 w-4 text-brand" />
              Save to Session
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              {sessionCount} / 12 Sessions
            </Badge>
          </div>
          <DialogDescription className="text-xs text-ink-muted">
            Organize bookmarks across Discussions, Problems, Solutions, Lessons, and Past Papers.
          </DialogDescription>
        </DialogHeader>

        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="mb-4 text-sm text-ink-muted">
              Please sign in to save items to your sessions.
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
                        "w-full flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition",
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
                          {isItemInSession && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="truncate font-medium">
                          {session.title || session.name || "Untitled Session"}
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
              {isAtCapacity ? (
                <p className="text-center text-xs text-ink-muted">
                  Maximum limit of 12 saved sessions reached.
                </p>
              ) : (
                <form onSubmit={handleCreateAndSave} className="flex gap-2">
                  <Input
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="Create new session..."
                    className="h-8 text-xs"
                    disabled={isCreatingNew || isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 shrink-0 text-xs gap-1"
                    disabled={isCreatingNew || !newSessionTitle.trim() || isLoading}
                  >
                    {isCreatingNew ? (
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
