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
  FileText,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  FileDown,
  ExternalLink,
  Loader2,
  X,
  ArrowRight,
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
  useSavedSession,
  useUpdateSavedSession,
  useDeleteSavedSession,
  useRemoveSessionItem,
} from "@/hooks/use-collections";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PostCard, LessonCard } from "@/components/features/content-cards";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SavedSessionItem } from "@/types";

type CategoryTab = "all" | "post" | "problem" | "solution" | "lesson" | "resource";

export default function SavedSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();

  const { data: session, isLoading, isError } = useSavedSession(id);
  const updateMutation = useUpdateSavedSession();
  const deleteMutation = useDeleteSavedSession();
  const removeMutation = useRemoveSessionItem();

  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-5xl py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="max-w-3xl py-16 text-center">
        <h2 className="text-xl font-bold text-foreground">Saved session not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This session may be private or has been deleted.
        </p>
        <Button variant="outline" className="mt-6" nativeButton={false} render={<Link href="/saved-sessions" />}>
          Back to Saved Sessions
        </Button>
      </div>
    );
  }

  const isOwner = Boolean(user && session.user && (user.id === session.user || user.clerk_id === session.user));
  const items: SavedSessionItem[] = session.items || [];

  const postItems = items.filter((i) => i.item_type === "POST" || (i.post && !i.lesson && !i.problem && !i.solution && !i.resource));
  const problemItems = items.filter((i) => i.item_type === "PROBLEM" || (i.problem && !i.post && !i.lesson && !i.solution && !i.resource));
  const solutionItems = items.filter((i) => i.item_type === "SOLUTION" || (i.solution && !i.post && !i.lesson && !i.problem && !i.resource));
  const lessonItems = items.filter((i) => i.item_type === "LESSON" || (i.lesson && !i.post && !i.problem && !i.solution && !i.resource));
  const resourceItems = items.filter((i) => i.item_type === "RESOURCE" || (i.resource && !i.post && !i.lesson && !i.problem && !i.solution));

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "post") return item.item_type === "POST" || (item.post && !item.lesson && !item.problem && !item.solution && !item.resource);
    if (activeTab === "problem") return item.item_type === "PROBLEM" || (item.problem && !item.post && !item.lesson && !item.solution && !item.resource);
    if (activeTab === "solution") return item.item_type === "SOLUTION" || (item.solution && !item.post && !item.lesson && !item.problem && !item.resource);
    if (activeTab === "lesson") return item.item_type === "LESSON" || (item.lesson && !item.post && !item.problem && !item.solution && !item.resource);
    if (activeTab === "resource") return item.item_type === "RESOURCE" || (item.resource && !item.post && !item.lesson && !item.problem && !item.solution);
    return true;
  });

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    toast.success("Copied public share link!");
  };

  const handleTogglePrivacy = async () => {
    try {
      await updateMutation.mutateAsync({
        id: session.id,
        data: { is_public: !session.is_public },
      });
      toast.success(
        session.is_public
          ? "Session is now private."
          : "Session is now public and shareable."
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
        id: session.id,
        data: { title: newTitle.trim() },
      });
      toast.success("Session renamed successfully.");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to rename session.");
    }
  };

  const handleDeleteSession = async () => {
    try {
      await deleteMutation.mutateAsync(session.id);
      toast.success("Saved session deleted.");
      router.push("/saved-sessions");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete session.");
    }
  };

  const handleRemoveItem = async (itemId: string, itemLabel: string) => {
    setRemovingItemId(itemId);
    try {
      await removeMutation.mutateAsync({
        sessionId: session.id,
        itemId,
      });
      toast.success(`Removed ${itemLabel} from session.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove item.");
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/saved-sessions"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to saved sessions
        </Link>
      </div>

      {/* Header Container */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground truncate">
                {session.title || (session as any).name || "Untitled Session"}
              </h1>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle(session.title || (session as any).name || "");
                    setEditOpen(true);
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  title="Rename Session"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Created {formatDate(session.created_at)}</span>
              <span>·</span>
              <span>{items.length} {items.length === 1 ? "item" : "items"} saved</span>
              <span>·</span>
              <Badge variant={session.is_public ? "default" : "outline"} className="gap-1 text-[11px]">
                {session.is_public ? (
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

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePrivacy}
                disabled={updateMutation.isPending}
                className="gap-1.5 text-xs"
              >
                {session.is_public ? (
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
              title="Copy link to this session"
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
                title="Delete this session"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("post")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
            activeTab === "post"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileText className="h-3 w-3" />
          Discussions ({postItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("problem")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
            activeTab === "problem"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <HelpCircle className="h-3 w-3" />
          Problems ({problemItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("solution")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
            activeTab === "solution"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
          Solutions ({solutionItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lesson")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
            activeTab === "lesson"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <BookOpen className="h-3 w-3" />
          Lessons ({lessonItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resource")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
            activeTab === "resource"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileDown className="h-3 w-3" />
          Past Papers ({resourceItems.length})
        </button>
      </div>

      {/* Content Viewport */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title={
            items.length === 0
              ? "This session is currently empty"
              : "No items in this category"
          }
          description={
            items.length === 0
              ? "Bookmark interesting forum posts, problems, solutions, lessons, or past papers while studying."
              : "Switch tabs above or save more items to populate this view."
          }
        />
      ) : (
        <div className="space-y-6">
          {filteredItems.map((item) => {
            const isRemoving = removingItemId === item.id;

            const renderItemMetaRow = (typeLabel: string, badgeClassName: string) => (
              <div className="flex items-center justify-between gap-3 px-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={badgeClassName}>
                    {typeLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Saved {formatDate(item.added_at)}
                  </span>
                </div>
                {isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={isRemoving}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveItem(item.id, item.item_type || "item");
                    }}
                    className="gap-1 text-muted-foreground hover:text-destructive min-h-[36px] sm:min-h-0"
                    title="Remove from this session"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>Remove</span>
                  </Button>
                )}
              </div>
            );

            if (item.post_details) {
              return (
                <div key={item.id} className="space-y-2.5">
                  {renderItemMetaRow(
                    "Discussion Post",
                    "text-xs font-medium text-primary bg-primary/10 border-primary/30"
                  )}
                  <PostCard post={item.post_details} />
                </div>
              );
            }

            if (item.problem_details) {
              return (
                <div key={item.id} className="space-y-2.5">
                  {renderItemMetaRow(
                    "Problem",
                    "text-xs font-medium text-chart-3 bg-chart-3/10 border-chart-3/30"
                  )}
                  <ProblemCard problem={item.problem_details} />
                </div>
              );
            }

            if (item.lesson_details) {
              return (
                <div key={item.id} className="space-y-2.5">
                  {renderItemMetaRow(
                    "Lesson",
                    "text-xs font-medium text-warning bg-warning/10 border-warning/30"
                  )}
                  <LessonCard lesson={item.lesson_details} />
                </div>
              );
            }

            if (item.solution_details) {
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs font-medium text-primary bg-primary/10 border-primary/30"
                      >
                        Worked Solution
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Saved {formatDate(item.added_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono tabular-nums text-xs">
                        {item.solution_details.vote_count ?? item.solution_details.vote_score ?? 0} votes
                      </Badge>
                      {isOwner && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          disabled={isRemoving}
                          onClick={() => handleRemoveItem(item.id, item.item_type || "solution")}
                          className="gap-1 text-muted-foreground hover:text-destructive min-h-[36px] sm:min-h-0"
                          title="Remove from this session"
                        >
                          {isRemoving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/problems/${item.solution_details.problem}/solutions/${item.solution_details.id}`}
                    className="block hover:opacity-95 transition"
                  >
                    <div className="line-clamp-3 text-sm leading-relaxed text-foreground whitespace-pre-line">
                      {item.solution_details.body}
                    </div>
                  </Link>

                  <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">
                      By {item.solution_details.author_details?.display_name || "Community Solver"}
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/problems/${item.solution_details.problem}`}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline font-medium transition"
                        title="Open related problem in Solve! workspace"
                      >
                        <span>View Problem</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Link
                        href={`/problems/${item.solution_details.problem}/solutions/${item.solution_details.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline transition"
                      >
                        <span>View Solution</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.resource_details) {
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3"
                >
                  {renderItemMetaRow(
                    "Past Paper",
                    "text-xs font-medium text-chart-3 bg-chart-3/10 border-chart-3/30"
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <h3 className="font-heading font-semibold text-base text-foreground truncate">
                        {item.resource_details.title || item.resource_details.file_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {item.resource_details.subject_details && (
                          <Badge variant="outline">{item.resource_details.subject_details.name}</Badge>
                        )}
                        {item.resource_details.level_details && (
                          <Badge variant="outline">{item.resource_details.level_details.name}</Badge>
                        )}
                        {item.resource_details.year && (
                          <span className="font-mono tabular-nums">
                            {item.resource_details.year} {item.resource_details.session} ·{" "}
                            {item.resource_details.paper_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 text-xs"
                        nativeButton={false}
                        render={<Link href={`/train/${item.resource_details.id}`} />}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Train Workspace
                      </Button>

                      {item.resource_details.file_url && (
                        <a
                          href={item.resource_details.download_url || item.resource_details.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted transition"
                        >
                          <FileDown className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Saved Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 pt-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Session title"
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
            <DialogTitle>Delete Saved Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{session.title || (session as any).name}&rdquo;? All bookmarked items will be unlinked. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
