"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isAdminOrSuperAdmin } from "@/types/user";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  TagItem,
  SubjectItem,
  LevelItem,
  ExamYearItem,
  ExamSessionItem,
  ModerationReasonItem,
} from "@/hooks/use-exam-taxonomy";

type ActiveTab = "tags" | "academic" | "exams" | "moderation";

export default function AdminTaxonomyPage() {
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("tags");

  const isAuthorized = !isUserLoading && !!currentUser && isAdminOrSuperAdmin(currentUser.role);

  useEffect(() => {
    if (!isUserLoading && (!currentUser || !isAdminOrSuperAdmin(currentUser.role))) {
      router.replace("/admin/reports");
    }
  }, [isUserLoading, currentUser, router]);

  if (isUserLoading || !isAuthorized) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Taxonomy & Operations Studio"
        description="Comprehensive management of academic hierarchy, tag consolidation, exam timelines, and moderation rules."
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
      </div>

      {/* Tab Panels */}
      {activeTab === "tags" && <TagsMergeStudioSection />}
      {activeTab === "academic" && <AcademicStructureSection />}
      {activeTab === "exams" && <ExamPeriodsSection />}
      {activeTab === "moderation" && <ModerationReasonsSection />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TAGS & MERGE STUDIO SECTION
// ─────────────────────────────────────────────────────────────────────────────
function TagsMergeStudioSection() {
  const [search, setSearch] = useState("");
  const { data: tags = [], isLoading } = useTagsWithMetrics(search);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [primaryTagId, setPrimaryTagId] = useState<string>("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagNameInput, setTagNameInput] = useState("");

  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const mergeTagsMutation = useMergeTags();

  const handleToggleSelect = (id: string) => {
    setSelectedTagIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      // If primary was removed or not set, default to first in list
      if (!exists && next.length === 1) {
        setPrimaryTagId(id);
      } else if (exists && primaryTagId === id) {
        setPrimaryTagId(next[0] || "");
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTagIds.length === tags.length) {
      setSelectedTagIds([]);
      setPrimaryTagId("");
    } else {
      const allIds = tags.map((t) => t.id);
      setSelectedTagIds(allIds);
      if (!primaryTagId && allIds.length > 0) {
        setPrimaryTagId(allIds[0]);
      }
    }
  };

  const handleExecuteMerge = async () => {
    if (!primaryTagId || selectedTagIds.length < 2) return;
    const mergeIds = selectedTagIds.filter((id) => id !== primaryTagId);
    const targetTag = tags.find((t) => t.id === primaryTagId);

    if (
      !confirm(
        `Are you sure you want to merge ${mergeIds.length} tag(s) into "${targetTag?.name}"? This will reassign all forum posts and lessons permanently.`
      )
    ) {
      return;
    }

    await mergeTagsMutation.mutateAsync({
      primary_tag_id: primaryTagId,
      merge_tag_ids: mergeIds,
    });
    setSelectedTagIds([]);
    setPrimaryTagId("");
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

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
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
                          onChange={() => handleToggleSelect(tag.id)}
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
                              if (confirm(`Delete tag "#${tag.name}"?`)) {
                                deleteTagMutation.mutate(tag.id);
                              }
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

  // Modal states
  const [subjectModal, setSubjectModal] = useState<{ mode: "add" | "edit"; item?: SubjectItem } | null>(null);
  const [levelModal, setLevelModal] = useState<{ mode: "add" | "edit"; item?: LevelItem } | null>(null);

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
        data: { code: formCode.trim().toLowerCase(), name: formName.trim() },
      });
    } else {
      await createSubjectMutation.mutateAsync({
        code: formCode.trim().toLowerCase(),
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
        data: { code: formCode.trim().toLowerCase(), name: formName.trim() },
      });
    } else {
      await createLevelMutation.mutateAsync({
        code: formCode.trim().toLowerCase(),
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
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-ink-muted text-[11px]">{sub.code}</td>
                  <td className="p-3 font-medium text-ink">{sub.name}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-ink-muted hover:text-ink"
                        onClick={() => handleOpenSubjectModal(sub)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => {
                          if (confirm(`Delete subject "${sub.name}"?`)) {
                            deleteSubjectMutation.mutate(sub.id);
                          }
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
              {levels.map((lvl) => (
                <tr key={lvl.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-ink-muted text-[11px]">{lvl.code}</td>
                  <td className="p-3 font-medium text-ink">{lvl.name}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-ink-muted hover:text-ink"
                        onClick={() => handleOpenLevelModal(lvl)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => {
                          if (confirm(`Delete level "${lvl.name}"?`)) {
                            deleteLevelMutation.mutate(lvl.id);
                          }
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
                  placeholder="e.g. physics"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
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
                  placeholder="e.g. a_level"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary"
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
  const [yearInput, setYearInput] = useState<number>(new Date().getFullYear());

  const [sessionModal, setSessionModal] = useState<{ mode: "add" | "edit"; item?: ExamSessionItem } | null>(null);
  const [sessionCode, setSessionCode] = useState("");
  const [sessionName, setSessionName] = useState("");

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearInput) return;
    await createYearMutation.mutateAsync({ year: Number(yearInput), is_active: true });
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
              setYearInput(new Date().getFullYear() + 1);
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
              {years.map((y) => (
                <tr key={y.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-semibold text-ink text-sm">{y.year}</td>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-danger hover:text-danger hover:bg-danger/10"
                      onClick={() => {
                        if (confirm(`Delete exam year ${y.year}?`)) {
                          deleteYearMutation.mutate(y.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
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
                  <td className="p-3 font-mono font-bold text-ink-muted text-[11px]">{sess.code}</td>
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
                          if (confirm(`Delete session "${sess.name}"?`)) {
                            deleteSessionMutation.mutate(sess.id);
                          }
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
                <label className="block text-[11px] font-medium text-ink-muted mb-1">Year (e.g. 2027)</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={yearInput}
                  onChange={(e) => setYearInput(Number(e.target.value))}
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
                          if (confirm(`Delete violation reason "${r.label}"?`)) {
                            deleteReasonMutation.mutate(r.id);
                          }
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
    </div>
  );
}
