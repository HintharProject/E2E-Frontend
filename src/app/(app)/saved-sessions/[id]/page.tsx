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
  Bookmark,
  Check,
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
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
        <h2 className="text-xl font-bold text-ink">Saved session not found</h2>
        <p className="mt-2 text-sm text-ink-muted">
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/saved-sessions"
          className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to saved sessions
        </Link>
      </div>

      {/* Header Container */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink truncate">
                {session.title || (session as any).name || "Untitled Session"}
              </h1>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle(session.title || (session as any).name || "");
                    setEditOpen(true);
                  }}
                  className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-muted transition"
                  title="Rename Session"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
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
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            activeTab === "all"
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
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
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
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
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
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
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
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
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
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
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
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
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isRemoving = removingItemId === item.id;

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-line bg-card p-1 shadow-sm transition hover:border-brand/40"
              >
                {/* Quick Remove Button (Owner only) */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveItem(item.id, item.item_type || "item");
                    }}
                    disabled={isRemoving}
                    className="absolute -top-2.5 -right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-card text-ink-muted shadow-sm hover:border-destructive hover:bg-destructive hover:text-white transition cursor-pointer"
                    title="Remove from this session"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                {/* Render Post */}
                {item.post_details && (
                  <div className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-brand bg-brand/5 border-brand/20">
                        Discussion Post
                      </Badge>
                      <span className="text-[11px] text-ink-muted">
                        Saved {formatDate(item.added_at)}
                      </span>
                    </div>
                    <PostCard post={item.post_details} />
                  </div>
                )}

                {/* Render Problem */}
                {item.problem_details && (
                  <div className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800">
                        Problem
                      </Badge>
                      <span className="text-[11px] text-ink-muted">
                        Saved {formatDate(item.added_at)}
                      </span>
                    </div>
                    <ProblemCard problem={item.problem_details} />
                  </div>
                )}

                {/* Render Solution Card */}
                {item.solution_details && (
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                          Worked Solution
                        </Badge>
                        <span className="text-[11px] text-ink-muted">
                          Saved {formatDate(item.added_at)}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        ★ {item.solution_details.vote_count ?? item.solution_details.vote_score ?? 0} Votes
                      </Badge>
                    </div>

                    {/* Solution Text (Clickable to detailed view) */}
                    <Link
                      href={`/problems/${item.solution_details.problem}/solutions/${item.solution_details.id}`}
                      className="block group/solution hover:opacity-95 transition"
                    >
                      <div className="line-clamp-3 text-sm text-ink/90 whitespace-pre-line font-sans">
                        {item.solution_details.body}
                      </div>
                    </Link>

                    {/* Metadata & Actions */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs">
                      <span className="text-ink-muted font-medium">
                        By {item.solution_details.author_details?.display_name || "Community Solver"}
                      </span>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/problems/${item.solution_details.problem}`}
                          className="inline-flex items-center gap-1 text-ink-muted hover:text-ink hover:underline font-medium transition"
                          title="Open related problem in Solve! workspace"
                        >
                          <span>View Problem</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`/problems/${item.solution_details.problem}/solutions/${item.solution_details.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-brand hover:underline transition"
                        >
                          <span>View Solution</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Render Lesson */}
                {item.lesson_details && (
                  <div className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                        Lesson
                      </Badge>
                      <span className="text-[11px] text-ink-muted">
                        Saved {formatDate(item.added_at)}
                      </span>
                    </div>
                    <LessonCard lesson={item.lesson_details} />
                  </div>
                )}

                {/* Render Exam Paper Resource */}
                {item.resource_details && (
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800">
                          Past Paper
                        </Badge>
                        <span className="text-[11px] text-ink-muted">
                          Saved {formatDate(item.added_at)}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-ink truncate">
                        {item.resource_details.title || item.resource_details.file_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                        {item.resource_details.subject_details && (
                          <Badge variant="outline">{item.resource_details.subject_details.name}</Badge>
                        )}
                        {item.resource_details.level_details && (
                          <Badge variant="outline">{item.resource_details.level_details.name}</Badge>
                        )}
                        {item.resource_details.year && (
                          <span>
                            {item.resource_details.year} {item.resource_details.session} · {item.resource_details.paper_type}
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
                          className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-card px-2.5 text-xs font-medium text-ink hover:bg-muted transition"
                        >
                          <FileDown className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
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
