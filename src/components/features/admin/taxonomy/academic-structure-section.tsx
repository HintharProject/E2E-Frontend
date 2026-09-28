"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Layers,
  X,
} from "lucide-react";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useLevels,
  useCreateLevel,
  useUpdateLevel,
  useDeleteLevel,
  SubjectItem,
  LevelItem,
} from "@/hooks/use-exam-taxonomy";
import { ConfirmDialog } from "./confirm-dialog";

export function AcademicStructureSection() {
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
