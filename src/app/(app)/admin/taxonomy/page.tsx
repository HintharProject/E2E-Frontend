"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isAdminOrSuperAdmin, isModeratorOrAbove } from "@/types/user";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Search,
  GitMerge,
  ShieldAlert,
  Calendar,
  GraduationCap,
  Tag as TagIcon,
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  Layers,
  Power,
  Layers3,
  FileText,
  HelpCircle,
  BookOpen,
  Filter,
  ExternalLink,
} from "lucide-react";
import {
  useTagsWithMetrics,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useMergeTags,
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useLevels,
  useCreateLevel,
  useUpdateLevel,
  useDeleteLevel,
  useExamYears,
  useCreateExamYear,
  useUpdateExamYear,
  useDeleteExamYear,
  useExamSessions,
  useCreateExamSession,
  useUpdateExamSession,
  useDeleteExamSession,
  useModerationReasons,
  useCreateModerationReason,
  useUpdateModerationReason,
  useDeleteModerationReason,
  useUnclassifiedContents,
  useReassignUnclassifiedContent,
  useExamTaxonomy,
  TagItem,
  SubjectItem,
  LevelItem,
  ExamYearItem,
  ExamSessionItem,
  ModerationReasonItem,
  UnclassifiedContentItem,
} from "@/hooks/use-exam-taxonomy";
import { formatSession, formatYear } from "@/lib/resources";

type ActiveTab = "tags" | "academic" | "exams" | "moderation" | "unclassified";


export default function AdminTaxonomyPage() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <AdminTaxonomyContent />
    </Suspense>
  );
}

function AdminTaxonomyContent() {
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ActiveTab | null;

  const isStaff = !isUserLoading && !!currentUser && isModeratorOrAbove(currentUser.role);
  const isAdmin = !isUserLoading && !!currentUser && isAdminOrSuperAdmin(currentUser.role);
  const isModeratorOnly = !isUserLoading && !!currentUser && currentUser.role === "MODERATOR";

  const initialTab: ActiveTab = (tabParam && ["tags", "academic", "exams", "moderation", "unclassified"].includes(tabParam))
    ? (isModeratorOnly && !["tags", "unclassified"].includes(tabParam) ? "tags" : tabParam)
    : "tags";

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  useEffect(() => {
    if (tabParam && ["tags", "academic", "exams", "moderation", "unclassified"].includes(tabParam)) {
      if (isModeratorOnly && !["tags", "unclassified"].includes(tabParam)) {
        setActiveTab("tags");
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam, isModeratorOnly]);

  useEffect(() => {
    if (!isUserLoading && (!currentUser || !isModeratorOrAbove(currentUser.role))) {
      router.replace("/admin/reports");
    }
  }, [isUserLoading, currentUser, router]);

  if (isUserLoading || !isStaff) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title={isModeratorOnly ? "Community Content & Tag Operations" : "Taxonomy & Operations Studio"}
        description={
          isModeratorOnly
            ? "Consolidate duplicate tags across forum and learning materials, and reclassify untagged or fallback content."
            : "Comprehensive management of academic hierarchy, tag consolidation, exam timelines, and moderation rules."
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("tags")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "tags"
              ? "bg-card text-ink shadow-sm border border-line font-semibold"
              : "text-ink-muted hover:text-ink hover:bg-card/50"
          }`}
        >
          <TagIcon className="size-3.5 text-primary" />
          Tags & Merge Studio
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("academic")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === "academic"
                  ? "bg-card text-ink shadow-sm border border-line font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-card/50"
              }`}
            >
              <GraduationCap className="size-3.5 text-blue-500" />
              Academic Structure (Subjects & Levels)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("exams")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === "exams"
                  ? "bg-card text-ink shadow-sm border border-line font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-card/50"
              }`}
            >
              <Calendar className="size-3.5 text-emerald-500" />
              Exam Periods & Sessions
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("moderation")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === "moderation"
                  ? "bg-card text-ink shadow-sm border border-line font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-card/50"
              }`}
            >
              <ShieldAlert className="size-3.5 text-amber-500" />
              Violation Reasons Taxonomy
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("unclassified")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "unclassified"
              ? "bg-card text-ink shadow-sm border border-line font-semibold"
              : "text-ink-muted hover:text-ink hover:bg-card/50"
          }`}
        >
          <Layers3 className="size-3.5 text-purple-500" />
          Unclassified Content Triage
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "tags" && <TagsMergeStudioSection />}
      {isAdmin && activeTab === "academic" && <AcademicStructureSection />}
      {isAdmin && activeTab === "exams" && <ExamPeriodsSection />}
      {isAdmin && activeTab === "moderation" && <ModerationReasonsSection />}
      {activeTab === "unclassified" && <UnclassifiedTriageSection />}
    </div>
  );
}

function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  variant = "destructive",
  isLoading = false,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-ink">{title}</DialogTitle>
          <DialogDescription className="text-xs text-ink-muted leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// 1. TAGS & MERGE STUDIO SECTION
// ─────────────────────────────────────────────────────────────────────────────
function TagsMergeStudioSection() {
  const [search, setSearch] = useState("");
  const { data: rawTags = [], isLoading } = useTagsWithMetrics(search);
  const tags = useMemo(() => {
    return [...rawTags].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [rawTags]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTagsMap, setSelectedTagsMap] = useState<Record<string, TagItem>>({});
  const [primaryTagId, setPrimaryTagId] = useState<string>("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagNameInput, setTagNameInput] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const mergeTagsMutation = useMergeTags();

  // Keep selected tags cached so search queries don't wipe their labels or metrics
  useEffect(() => {
    if (tags.length > 0) {
      setSelectedTagsMap((prev) => {
        const next = { ...prev };
        tags.forEach((t) => {
          if (selectedTagIds.includes(t.id)) {
            next[t.id] = t;
          }
        });
        return next;
      });
    }
  }, [tags, selectedTagIds]);

  const handleToggleSelect = (tag: TagItem) => {
    setSelectedTagIds((prev) => {
      const exists = prev.includes(tag.id);
      const next = exists ? prev.filter((item) => item !== tag.id) : [...prev, tag.id];
      if (!exists) {
        setSelectedTagsMap((m) => ({ ...m, [tag.id]: tag }));
        if (next.length === 1) setPrimaryTagId(tag.id);
      } else {
        if (primaryTagId === tag.id) setPrimaryTagId(next[0] || "");
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTagIds.length === tags.length && tags.length > 0) {
      setSelectedTagIds([]);
      setPrimaryTagId("");
    } else {
      const allIds = tags.map((t) => t.id);
      setSelectedTagIds(allIds);
      const nextMap: Record<string, TagItem> = { ...selectedTagsMap };
      tags.forEach((t) => {
        nextMap[t.id] = t;
      });
      setSelectedTagsMap(nextMap);
      if (!primaryTagId && allIds.length > 0) {
        setPrimaryTagId(allIds[0]);
      }
    }
  };

  const handleExecuteMerge = () => {
    if (!primaryTagId || selectedTagIds.length < 2) return;
    const mergeIds = selectedTagIds.filter((id) => id !== primaryTagId);
    const targetTag = selectedTagsMap[primaryTagId] || tags.find((t) => t.id === primaryTagId);

    setConfirmModal({
      isOpen: true,
      title: `Merge ${mergeIds.length} Tags into #${targetTag?.name || "Target"}`,
      description: `Are you sure you want to merge ${mergeIds.length} tag(s) into #${targetTag?.name}? All forum posts and lessons tagged with the source tags will be permanently re-linked to #${targetTag?.name}, and the source tags will be deleted.`,
      confirmLabel: "Merge Tags",
      onConfirm: async () => {
        await mergeTagsMutation.mutateAsync({
          primary_tag_id: primaryTagId,
          merge_tag_ids: mergeIds,
        });
        setSelectedTagIds([]);
        setPrimaryTagId("");
        setConfirmModal(null);
      },
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagNameInput.trim()) return;
    await createTagMutation.mutateAsync({ name: tagNameInput.trim() });
    setTagNameInput("");
    setIsAddOpen(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !tagNameInput.trim()) return;
    await updateTagMutation.mutateAsync({ id: editingTag.id, name: tagNameInput.trim() });
    setTagNameInput("");
    setEditingTag(null);
  };

  const selectedTags = selectedTagIds
    .map((id) => selectedTagsMap[id] || tags.find((t) => t.id === id))
    .filter(Boolean) as TagItem[];
  const totalAffectedPosts = selectedTags
    .filter((t) => t.id !== primaryTagId)
    .reduce((acc, t) => acc + (t.post_count || 0), 0);
  const totalAffectedLessons = selectedTags
    .filter((t) => t.id !== primaryTagId)
    .reduce((acc, t) => acc + (t.lesson_count || 0), 0);

  return (

    <div className="flex flex-col gap-4">
      {/* Studio Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-card">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 size-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search tags by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-surface text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              setTagNameInput("");
              setIsAddOpen(true);
            }}
            className="h-9 gap-1.5 text-xs"
          >
            <Plus className="size-4" /> Add Tag
          </Button>
        </div>
      </div>

      {/* Tags Data Table */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <TagIcon className="size-8 text-ink-muted/50 mb-2" />
            <p className="text-sm font-medium text-ink">No tags found</p>
            <p className="text-xs text-ink-muted mt-1">Try a different search query or create a new tag.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-line text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-line"
                      checked={selectedTagIds.length === tags.length && tags.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-3">Tag Name</th>
                  <th className="p-3 text-center">Forum Posts</th>
                  <th className="p-3 text-center">Lessons</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isPrimary = tag.id === primaryTagId;

                  return (
                    <tr
                      key={tag.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-line"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tag)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">#{tag.name}</span>
                          {isPrimary && selectedTagIds.length > 1 && (
                            <Badge className="text-[10px] py-0 bg-primary/10 text-primary border-primary/20">
                              Primary Target
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-ink border border-line">
                          {tag.post_count || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-ink border border-line">
                          {tag.lesson_count || 0}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-ink-muted hover:text-ink"
                            onClick={() => {
                              setEditingTag(tag);
                              setTagNameInput(tag.name);
                            }}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-danger hover:text-danger hover:bg-danger/10"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: `Delete Tag #${tag.name}`,
                                description: `Are you sure you want to delete tag #${tag.name}? It will be unlinked from ${tag.post_count || 0} posts and ${tag.lesson_count || 0} lessons.`,
                                confirmLabel: "Delete Tag",
                                onConfirm: async () => {
                                  await deleteTagMutation.mutateAsync(tag.id);
                                  setConfirmModal(null);
                                },
                              });
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Interactive Merge Studio Dock */}
      {selectedTagIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-3xl rounded-2xl border border-line bg-card/95 backdrop-blur-md shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <GitMerge className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink">
                  Merge Studio ({selectedTagIds.length} tags selected)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Consolidating {totalAffectedPosts} posts, {totalAffectedLessons} lessons
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-ink-muted">Designate Target Tag:</span>
                <select
                  value={primaryTagId}
                  onChange={(e) => setPrimaryTagId(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-2 py-0.5 text-xs font-semibold text-ink focus:outline-none focus:border-primary"
                >
                  {selectedTags.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                setSelectedTagIds([]);
                setPrimaryTagId("");
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={handleExecuteMerge}
              disabled={mergeTagsMutation.isPending || !primaryTagId}
            >
              {mergeTagsMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <GitMerge className="size-3.5" />
              )}
              Execute Merge
            </Button>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h4 className="font-semibold text-sm text-ink">Create New Tag</h4>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Tag Name (lowercase, no spaces)
                </label>
                <input
                  type="text"
                  placeholder="e.g. thermodynamics"
                  value={tagNameInput}
                  onChange={(e) => setTagNameInput(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createTagMutation.isPending || !tagNameInput.trim()}
                >
                  {createTagMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Create Tag
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h4 className="font-semibold text-sm text-ink">Rename Tag</h4>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={tagNameInput}
                  onChange={(e) => setTagNameInput(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTag(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateTagMutation.isPending || !tagNameInput.trim()}
                >
                  {updateTagMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Dialog */}
      <ConfirmDialog

        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title || ""}
        description={confirmModal?.description || ""}
        confirmLabel={confirmModal?.confirmLabel || "Confirm"}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
        isLoading={mergeTagsMutation.isPending || deleteTagMutation.isPending}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ACADEMIC STRUCTURE SECTION (Subjects & Levels)
// ─────────────────────────────────────────────────────────────────────────────
function AcademicStructureSection() {
  const { data: subjects = [], isLoading: isSubjectsLoading } = useSubjects();
  const { data: levels = [], isLoading: isLevelsLoading } = useLevels();

  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const createLevelMutation = useCreateLevel();
  const updateLevelMutation = useUpdateLevel();
  const deleteLevelMutation = useDeleteLevel();

  const [subjectModal, setSubjectModal] = useState<{ mode: "add" | "edit"; item?: SubjectItem } | null>(null);
  const [levelModal, setLevelModal] = useState<{ mode: "add" | "edit"; item?: LevelItem } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");


  const handleOpenSubjectModal = (item?: SubjectItem) => {
    if (item) {
      setSubjectModal({ mode: "edit", item });
      setFormCode(item.code);
      setFormName(item.name);
    } else {
      setSubjectModal({ mode: "add" });
      setFormCode("");
      setFormName("");
    }
  };

  const handleOpenLevelModal = (item?: LevelItem) => {
    if (item) {
      setLevelModal({ mode: "edit", item });
      setFormCode(item.code);
      setFormName(item.name);
    } else {
      setLevelModal({ mode: "add" });
      setFormCode("");
      setFormName("");
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;
    if (subjectModal?.mode === "edit" && subjectModal.item) {
      await updateSubjectMutation.mutateAsync({
        id: subjectModal.item.id,
        data: { code: formCode.trim().toUpperCase(), name: formName.trim() },
      });
    } else {
      await createSubjectMutation.mutateAsync({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
      });
    }
    setSubjectModal(null);
  };

  const handleLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;
    if (levelModal?.mode === "edit" && levelModal.item) {
      await updateLevelMutation.mutateAsync({
        id: levelModal.item.id,
        data: { code: formCode.trim().toUpperCase(), name: formName.trim() },
      });
    } else {
      await createLevelMutation.mutateAsync({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
      });
    }
    setLevelModal(null);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Subjects Card */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-blue-500" />
            <h3 className="font-semibold text-ink text-sm">Subjects</h3>
            <Badge variant="outline" className="text-[10px]">
              {subjects.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => handleOpenSubjectModal()}
          >
            <Plus className="size-3.5" /> Add Subject
          </Button>
        </div>

        {isSubjectsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 border-b border-line text-ink-muted uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subjects.map((sub) => {
                const isFallback = sub.code.toUpperCase() === "UNDEFINED";
                return (
                  <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-ink-muted text-[11px]">
                      {sub.code}
                      {isFallback && (
                        <Badge className="ml-2 text-[9px] py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          Fallback
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 font-medium text-ink">{sub.name}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-ink-muted hover:text-ink"
                          onClick={() => handleOpenSubjectModal(sub)}
                          disabled={isFallback}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-danger hover:text-danger hover:bg-danger/10 disabled:opacity-30"
                          disabled={isFallback}
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: `Delete Subject "${sub.name}"`,
                              description: `Are you sure you want to delete subject "${sub.name}"? A tag #${sub.code.toLowerCase()} will be auto-created for taggable posts and lessons. All dependent posts, problems, lessons, and resources will safely fall back to "undefined".`,
                              confirmLabel: "Delete Subject",
                              onConfirm: async () => {
                                await deleteSubjectMutation.mutateAsync(sub.id);
                                setConfirmModal(null);
                              },
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Levels Card */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-purple-500" />
            <h3 className="font-semibold text-ink text-sm">Educational Levels</h3>
            <Badge variant="outline" className="text-[10px]">
              {levels.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => handleOpenLevelModal()}
          >
            <Plus className="size-3.5" /> Add Level
          </Button>
        </div>

        {isLevelsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 border-b border-line text-ink-muted uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {levels.map((lvl) => {
                const isFallback = lvl.code.toUpperCase() === "UNDEFINED";
                return (
                  <tr key={lvl.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-ink-muted text-[11px]">
                      {lvl.code}
                      {isFallback && (
                        <Badge className="ml-2 text-[9px] py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          Fallback
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 font-medium text-ink">{lvl.name}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-ink-muted hover:text-ink"
                          onClick={() => handleOpenLevelModal(lvl)}
                          disabled={isFallback}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-danger hover:text-danger hover:bg-danger/10 disabled:opacity-30"
                          disabled={isFallback}
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: `Delete Level "${lvl.name}"`,
                              description: `Are you sure you want to delete level "${lvl.name}"? A tag #${lvl.code.toLowerCase()} will be auto-created for taggable posts and lessons. All dependent posts, problems, lessons, and resources will safely fall back to "undefined".`,
                              confirmLabel: "Delete Level",
                              onConfirm: async () => {
                                await deleteLevelMutation.mutateAsync(lvl.id);
                                setConfirmModal(null);
                              },
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        )}
      </div>

      {/* Subject Modal */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h4 className="font-semibold text-sm text-ink">
                {subjectModal.mode === "edit" ? "Edit Subject" : "Add Subject"}
              </h4>
              <button
                type="button"
                onClick={() => setSubjectModal(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubjectSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. PHYSICS"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Physics"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSubjectModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}>
                  Save Subject
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Level Modal */}
      {levelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h4 className="font-semibold text-sm text-ink">
                {levelModal.mode === "edit" ? "Edit Level" : "Add Educational Level"}
              </h4>
              <button
                type="button"
                onClick={() => setLevelModal(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleLevelSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. A_LEVEL"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. A Level"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setLevelModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createLevelMutation.isPending || updateLevelMutation.isPending}>
                  Save Level
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Dialog */}
      <ConfirmDialog

        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title || ""}
        description={confirmModal?.description || ""}
        confirmLabel={confirmModal?.confirmLabel || "Delete"}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => confirmModal?.onConfirm()}
        isLoading={deleteSubjectMutation.isPending || deleteLevelMutation.isPending}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXAM PERIODS & SESSIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ExamPeriodsSection() {
  const { data: years = [], isLoading: isYearsLoading } = useExamYears();
  const { data: sessions = [], isLoading: isSessionsLoading } = useExamSessions();

  const createYearMutation = useCreateExamYear();
  const updateYearMutation = useUpdateExamYear();
  const deleteYearMutation = useDeleteExamYear();

  const createSessionMutation = useCreateExamSession();
  const updateSessionMutation = useUpdateExamSession();
  const deleteSessionMutation = useDeleteExamSession();

  // Modals
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [yearInput, setYearInput] = useState<string>(String(new Date().getFullYear()));

  const [sessionModal, setSessionModal] = useState<{ mode: "add" | "edit"; item?: ExamSessionItem } | null>(null);
  const [sessionCode, setSessionCode] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);


  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearInput.trim()) return;
    await createYearMutation.mutateAsync({ year: yearInput.trim().toLowerCase(), is_active: true });
    setIsAddYearOpen(false);
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim() || !sessionName.trim()) return;
    if (sessionModal?.mode === "edit" && sessionModal.item) {
      await updateSessionMutation.mutateAsync({
        id: sessionModal.item.id,
        data: { code: sessionCode.trim().toUpperCase(), name: sessionName.trim() },
      });
    } else {
      await createSessionMutation.mutateAsync({
        code: sessionCode.trim().toUpperCase(),
        name: sessionName.trim(),
        is_active: true,
      });
    }
    setSessionModal(null);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Exam Years */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-emerald-500" />
            <h3 className="font-semibold text-ink text-sm">Exam Years</h3>
            <Badge variant="outline" className="text-[10px]">
              {years.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              setYearInput(String(new Date().getFullYear() + 1));
              setIsAddYearOpen(true);
            }}
          >
            <Plus className="size-3.5" /> Add Year
          </Button>
        </div>

        {isYearsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 border-b border-line text-ink-muted uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Year</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {years.map((y) => {
                const isFallbackYear = String(y.year).toLowerCase() === "others" || y.year === 0;
                return (
                  <tr key={y.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 font-semibold text-ink text-sm">
                      <div className="flex items-center gap-2">
                        <span>{formatYear(y.year)}</span>
                        {isFallbackYear && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">
                            Fallback
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => updateYearMutation.mutate({ id: y.id, data: { is_active: !y.is_active } })}
                        className="inline-flex items-center gap-1 cursor-pointer"
                      >
                        {y.is_active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 hover:bg-emerald-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] py-0 text-ink-muted hover:bg-muted">
                            Inactive
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      {isFallbackYear ? (
                        <Badge variant="secondary" className="text-[10px] text-ink-muted">
                          Protected
                        </Badge>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-danger hover:text-danger hover:bg-danger/10"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: `Delete exam year ${y.year}?`,
                              description: `Deleting this exam year will reassign any associated past papers to the "Others" fallback year. This action is irreversible.`,
                              confirmLabel: "Delete Year",
                              onConfirm: async () => {
                                await deleteYearMutation.mutateAsync(y.id);
                                setConfirmModal(null);
                              },
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Exam Sessions */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2">
            <Layers3 className="size-4 text-cyan-500" />
            <h3 className="font-semibold text-ink text-sm">Exam Sessions</h3>
            <Badge variant="outline" className="text-[10px]">
              {sessions.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              setSessionModal({ mode: "add" });
              setSessionCode("");
              setSessionName("");
            }}
          >
            <Plus className="size-3.5" /> Add Session
          </Button>
        </div>

        {isSessionsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 border-b border-line text-ink-muted uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Display Name</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-ink-muted text-[11px]">
                    <div className="flex items-center gap-2">
                      <span>{sess.code}</span>
                      {sess.code === "OTHERS" && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">
                          Fallback
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-ink">{sess.name}</td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => updateSessionMutation.mutate({ id: sess.id, data: { is_active: !sess.is_active } })}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      {sess.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 hover:bg-emerald-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 text-ink-muted hover:bg-muted">
                          Inactive
                        </Badge>
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    {sess.code === "OTHERS" ? (
                      <Badge variant="secondary" className="text-[10px] text-ink-muted">
                        Protected
                      </Badge>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-ink-muted hover:text-ink"
                          onClick={() => {
                            setSessionModal({ mode: "edit", item: sess });
                            setSessionCode(sess.code);
                            setSessionName(sess.name);
                          }}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-danger hover:text-danger hover:bg-danger/10"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: `Delete session "${sess.name}"?`,
                              description: `Deleting this session will reassign any associated past papers to the "Others" fallback session. This action is irreversible.`,
                              confirmLabel: "Delete Session",
                              onConfirm: async () => {
                                await deleteSessionMutation.mutateAsync(sess.id);
                                setConfirmModal(null);
                              },
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Year Modal */}
      {isAddYearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs rounded-2xl border border-line bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h4 className="font-semibold text-sm text-ink">Add Exam Year</h4>
              <button
                type="button"
                onClick={() => setIsAddYearOpen(false)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleAddYear} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">Year (e.g. 2027 or others)</label>
                <input
                  type="text"
                  placeholder="e.g. 2027"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddYearOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createYearMutation.isPending || !yearInput}>
                  Save Year
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {sessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h4 className="font-semibold text-sm text-ink">
                {sessionModal.mode === "edit" ? "Edit Exam Session" : "Add Exam Session"}
              </h4>
              <button
                type="button"
                onClick={() => setSessionModal(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSessionSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Session Code (e.g. MAY_JUNE)
                </label>
                <input
                  type="text"
                  placeholder="e.g. FEB_MARCH"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Display Label (e.g. May / June)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Feb / March"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSessionModal(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
                >
                  Save Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmModal && (
        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          isLoading={deleteYearMutation.isPending || deleteSessionMutation.isPending}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MODERATION REASONS TAXONOMY SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ModerationReasonsSection() {
  const { data: reasons = [], isLoading } = useModerationReasons();
  const createReasonMutation = useCreateModerationReason();
  const updateReasonMutation = useUpdateModerationReason();
  const deleteReasonMutation = useDeleteModerationReason();

  const [modal, setModal] = useState<{ mode: "add" | "edit"; item?: ModerationReasonItem } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "NORMAL" | "HIGH_PRIORITY" | "CRITICAL">("NORMAL");

  const handleOpenModal = (item?: ModerationReasonItem) => {
    if (item) {
      setModal({ mode: "edit", item });
      setCode(item.code);
      setLabel(item.label);
      setDescription(item.description || "");
      setSeverity(item.default_severity);
    } else {
      setModal({ mode: "add" });
      setCode("");
      setLabel("");
      setDescription("");
      setSeverity("NORMAL");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !label.trim()) return;

    if (modal?.mode === "edit" && modal.item) {
      await updateReasonMutation.mutateAsync({
        id: modal.item.id,
        data: {
          code: code.trim().toUpperCase(),
          label: label.trim(),
          description: description.trim(),
          default_severity: severity,
        },
      });
    } else {
      await createReasonMutation.mutateAsync({
        code: code.trim().toUpperCase(),
        label: label.trim(),
        description: description.trim(),
        default_severity: severity,
        is_active: true,
      });
    }
    setModal(null);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] py-0">Critical</Badge>;
      case "HIGH_PRIORITY":
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px] py-0">High</Badge>;
      case "NORMAL":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] py-0">Normal</Badge>;
      case "LOW":
      default:
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] py-0">Low</Badge>;
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-500" />
          <h3 className="font-semibold text-ink text-sm">Violation & Moderation Reasons</h3>
          <Badge variant="outline" className="text-[10px]">
            {reasons.length}
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => handleOpenModal()}
        >
          <Plus className="size-3.5" /> Add Violation Reason
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-ink-muted" />
        </div>
      ) : reasons.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <ShieldAlert className="size-8 text-ink-muted/50 mb-2" />
          <p className="text-sm font-medium text-ink">No violation reasons defined</p>
          <p className="text-xs text-ink-muted mt-1">Configure moderation violation categories to classify reports.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 border-b border-line text-ink-muted uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Reason Code</th>
                <th className="p-3">Label</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Default Severity</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reasons.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-ink-muted text-[11px]">{r.code}</td>
                  <td className="p-3 font-semibold text-ink">{r.label}</td>
                  <td className="p-3 text-ink-muted max-w-xs truncate">{r.description || "—"}</td>
                  <td className="p-3 text-center">{getSeverityBadge(r.default_severity)}</td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => updateReasonMutation.mutate({ id: r.id, data: { is_active: !r.is_active } })}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      {r.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 hover:bg-emerald-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 text-ink-muted hover:bg-muted">
                          Inactive
                        </Badge>
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-ink-muted hover:text-ink"
                        onClick={() => handleOpenModal(r)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: `Delete violation reason "${r.label}"?`,
                            description: `Are you sure you want to delete this violation category? Existing reports with this reason code will retain their historical code, but users won't be able to select it for new reports.`,
                            confirmLabel: "Delete Reason",
                            onConfirm: async () => {
                              await deleteReasonMutation.mutateAsync(r.id);
                              setConfirmModal(null);
                            },
                          });
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reason Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h4 className="font-semibold text-sm text-ink">
                {modal.mode === "edit" ? "Edit Violation Reason" : "Add Violation Reason"}
              </h4>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Reason Code (uppercase, e.g. SPAM_OR_COMMERCIAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. COPYRIGHT_INFRINGEMENT"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Copyright Infringement"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Default Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
                >
                  <option value="LOW">Low (Minor infractions, formatting issues)</option>
                  <option value="NORMAL">Normal (Standard community guidelines)</option>
                  <option value="HIGH_PRIORITY">High Priority (Harassment, trolling, piracy)</option>
                  <option value="CRITICAL">Critical (Severe abuse, security threats)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Description / Staff Guidance
                </label>
                <textarea
                  rows={3}
                  placeholder="Explanation of when this reason applies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createReasonMutation.isPending || updateReasonMutation.isPending}
                >
                  Save Reason
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmModal && (
        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          isLoading={deleteReasonMutation.isPending}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. UNCLASSIFIED CONTENT TRIAGE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function UnclassifiedTriageSection() {
  const [contentType, setContentType] = useState<string>("all");
  const [issueType, setIssueType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<UnclassifiedContentItem | null>(null);

  const { data, isLoading } = useUnclassifiedContents({
    contentType,
    issueType,
    search: search.trim() || undefined,
  });

  const counts = data?.counts ?? {
    total: 0,
    posts: 0,
    problems: 0,
    lessons: 0,
    resources: 0,
    undefined_subjects: 0,
    undefined_levels: 0,
    other_years: 0,
    other_sessions: 0,
  };

  const results = data?.results ?? [];

  const getContentUrl = (item: UnclassifiedContentItem): string => {
    switch (item.content_type) {
      case "post":
        return `/posts/${item.id}`;
      case "problem":
        return `/problems/${item.id}`;
      case "lesson":
        return `/lessons/${item.id}`;
      case "resource":
        return item.file_url || `/resources?id=${item.id}`;
      default:
        return "#";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "post":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 py-0.5">
            <FileText className="size-3" /> Post
          </Badge>
        );
      case "problem":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 py-0.5">
            <HelpCircle className="size-3" /> Problem
          </Badge>
        );
      case "lesson":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0.5">
            <BookOpen className="size-3" /> Lesson
          </Badge>
        );
      case "resource":
      default:
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 py-0.5">
            <Layers className="size-3" /> Resource
          </Badge>
        );
    }
  };

  const getIssueBadges = (issues: string[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {issues.map((issue) => {
          let label: string = issue;
          let color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
          if (issue === "undefined_subject") {
            label = "Undefined Subject";
            color = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
          } else if (issue === "undefined_level") {
            label = "Undefined Level";
            color = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
          } else if (issue === "other_year") {
            label = "Others Year";
            color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
          } else if (issue === "other_session") {
            label = "Others Session";
            color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
          }
          return (
            <Badge key={issue} variant="outline" className={`text-[10px] py-0 font-medium ${color}`}>
              {label}
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Total Needing Triage</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-ink">{counts.total}</span>
            <AlertTriangle className={`size-5 ${counts.total > 0 ? "text-amber-500" : "text-emerald-500"}`} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Undefined Subject</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.undefined_subjects}</span>
            <GraduationCap className="size-5 text-rose-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Undefined Level</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.undefined_levels}</span>
            <Layers3 className="size-5 text-rose-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Others Year</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.other_years}</span>
            <Calendar className="size-5 text-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Others Session</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.other_sessions}</span>
            <Layers className="size-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Content Triage Container */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden flex flex-col">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 border-b border-line bg-surface gap-3">
          {/* Content Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Items", count: counts.total },
              { id: "post", label: "Posts", count: counts.posts },
              { id: "problem", label: "Problems", count: counts.problems },
              { id: "lesson", label: "Lessons", count: counts.lessons },
              { id: "resource", label: "Resources", count: counts.resources },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setContentType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  contentType === tab.id
                    ? "bg-card text-ink shadow-sm border border-line font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-card/50"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-ink-muted font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted pointer-events-none" />
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-line bg-surface text-xs focus:outline-none focus:border-primary text-ink"
              >
                <option value="all">All Issues</option>
                <option value="undefined_subject">Undefined Subject</option>
                <option value="undefined_level">Undefined Level</option>
                <option value="other_year">Other Year</option>
                <option value="other_session">Other Session</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line bg-surface text-xs focus:outline-none focus:border-primary text-ink"
              />
            </div>
          </div>
        </div>

        {/* Content Table / List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="size-10 text-emerald-500 mb-3" />
            <h4 className="text-sm font-semibold text-ink">Zero Unclassified Content</h4>
            <p className="text-xs text-ink-muted mt-1 max-w-sm">
              All active posts, problems, lessons, and past papers are mapped to valid subjects, levels, years, and sessions!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/50 border-b border-line text-ink-muted uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Content / Title</th>
                  <th className="p-3">Detected Issues</th>
                  <th className="p-3">Current Attributes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((item) => (
                  <tr key={`${item.content_type}-${item.id}`} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 align-top whitespace-nowrap">
                      {getTypeBadge(item.content_type)}
                    </td>
                    <td className="p-3 align-top max-w-xs">
                      <a
                        href={getContentUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-ink hover:text-primary hover:underline line-clamp-1 inline-flex items-center gap-1 group"
                        title="Click to view content in a new tab"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="size-3 text-ink-muted group-hover:text-primary shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>
                      <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-2">
                        {item.author && <span>By {item.author}</span>}
                        {item.created_at && (
                          <span>• {new Date(item.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      {getIssueBadges(item.issues)}
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.subject && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              item.subject.code === "undefined"
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                : ""
                            }`}
                          >
                            Sub: {item.subject.name || item.subject.code}
                          </Badge>
                        )}
                        {item.level && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              item.level.code === "undefined"
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                : ""
                            }`}
                          >
                            Lvl: {item.level.name || item.level.code}
                          </Badge>
                        )}
                        {item.year !== null && item.year !== undefined && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              String(item.year).toLowerCase() === "others" || item.year === 0
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                                : ""
                            }`}
                          >
                            Year: {formatYear(item.year)}
                          </Badge>
                        )}
                        {item.session && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              item.session === "OTHERS"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                                : ""
                            }`}
                          >
                            Session: {formatSession(item.session)}
                          </Badge>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 w-full">
                            <TagIcon className="size-3 text-ink-muted" />
                            <span className="text-[10px] text-ink-muted">
                              {item.tags.map((t) => t.name).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getContentUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-line bg-surface hover:bg-muted text-xs font-medium text-ink transition-colors"
                          title="Open content in new tab"
                        >
                          <ExternalLink className="size-3.5 text-ink-muted" />
                          <span>View</span>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Edit2 className="size-3.5" /> Reclassify
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reassign Dialog */}
      {selectedItem && (
        <ReassignTaxonomyDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REASSIGN TAXONOMY DIALOG
// ─────────────────────────────────────────────────────────────────────────────
function ReassignTaxonomyDialog({
  item,
  onClose,
}: {
  item: UnclassifiedContentItem;
  onClose: () => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();
  const { data: years = [] } = useExamYears();
  const { data: sessions = [] } = useExamSessions();
  const [tagSearch, setTagSearch] = useState("");
  const { data: availableTags = [] } = useTagsWithMetrics(tagSearch);

  const reassignMutation = useReassignUnclassifiedContent();

  const [subjectId, setSubjectId] = useState(item.subject?.id || "");
  const [levelId, setLevelId] = useState(item.level?.id || "");
  const [year, setYear] = useState<string | number>(item.year ?? "others");
  const [session, setSession] = useState<string>(item.session ?? "OTHERS");
  const [tags, setTags] = useState<{ id: string; name: string }[]>(item.tags || []);

  const handleAddTag = (t: { id: string; name: string }) => {
    if (!tags.some((existing) => existing.id === t.id)) {
      setTags([...tags, t]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await reassignMutation.mutateAsync({
      contentType: item.content_type,
      id: item.id,
      data: {
        subject_id: subjectId || undefined,
        level_id: levelId || undefined,
        year: item.content_type === "resource" ? String(year).toLowerCase() : undefined,
        session: item.content_type === "resource" ? session : undefined,
        tag_ids:
          item.content_type === "post" || item.content_type === "lesson"
            ? tags.map((t) => t.id)
            : undefined,
      },
    });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-ink flex items-center gap-2">
            <span>Reclassify Taxonomy</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {item.content_type}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Update academic subject, level, exam timeline, and tags for:
            <span className="block font-medium text-ink mt-1 truncate">&quot;{item.title}&quot;</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs mt-2">
          {/* Subject & Level Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Level
              </label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
              >
                <option value="">-- Select Level --</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} ({lvl.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resource Specific: Year and Session */}
          {item.content_type === "resource" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface border border-line">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Exam Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.year}>
                      {formatYear(y.year)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Exam Session
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Post / Lesson Specific: Tags Manager */}
          {(item.content_type === "post" || item.content_type === "lesson") && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface border border-line">
              <label className="text-[11px] font-medium text-ink-muted flex items-center justify-between">
                <span>Content Tags</span>
                <span className="text-[10px] text-ink-muted">{tags.length} assigned</span>
              </label>

              {/* Currently Selected Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-card border border-line">
                {tags.length === 0 ? (
                  <span className="text-xs text-ink-muted italic">No tags assigned</span>
                ) : (
                  tags.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium"
                    >
                      #{t.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t.id)}
                        className="hover:text-danger text-ink-muted"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Tag Picker / Search */}
              <div className="mt-1">
                <input
                  type="text"
                  placeholder="Search available tags to add..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-ink"
                />
                {availableTags.length > 0 && tagSearch && (
                  <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto p-1">
                    {availableTags.slice(0, 10).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAddTag(t)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] text-ink"
                      >
                        <Plus className="size-2.5 text-primary" /> #{t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={reassignMutation.isPending}
              className="gap-1.5"
            >
              {reassignMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Save & Reclassify
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
