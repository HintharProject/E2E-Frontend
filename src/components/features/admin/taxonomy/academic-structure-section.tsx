"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Layers,
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-chart-3" aria-hidden="true" />
            <h3 className="font-semibold text-foreground text-sm">Subjects</h3>
            <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
              {subjects.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => handleOpenSubjectModal()}
          >
            <Plus className="size-3.5" aria-hidden="true" /> Add Subject
          </Button>
        </div>

        {isSubjectsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase font-semibold text-[10px]">
                <tr>
                  <th scope="col" className="p-3">Code</th>
                  <th scope="col" className="p-3">Name</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map((sub) => {
                  const isFallback = sub.code.toUpperCase() === "UNDEFINED";
                  return (
                    <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-muted-foreground text-[11px]">
                        {sub.code}
                        {isFallback && (
                          <Badge variant="warning" className="ml-2 text-[10px] py-0">
                            Fallback
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 font-medium text-foreground">{sub.name}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit subject ${sub.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenSubjectModal(sub)}
                            disabled={isFallback}
                          >
                            <Edit2 className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete subject ${sub.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
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
                            <Trash2 className="size-3.5" aria-hidden="true" />
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

      {/* Levels Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-tier-4" aria-hidden="true" />
            <h3 className="font-semibold text-foreground text-sm">Educational Levels</h3>
            <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
              {levels.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => handleOpenLevelModal()}
          >
            <Plus className="size-3.5" aria-hidden="true" /> Add Level
          </Button>
        </div>

        {isLevelsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase font-semibold text-[10px]">
                <tr>
                  <th scope="col" className="p-3">Code</th>
                  <th scope="col" className="p-3">Name</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {levels.map((lvl) => {
                  const isFallback = lvl.code.toUpperCase() === "UNDEFINED";
                  return (
                    <tr key={lvl.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-muted-foreground text-[11px]">
                        {lvl.code}
                        {isFallback && (
                          <Badge variant="warning" className="ml-2 text-[10px] py-0">
                            Fallback
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 font-medium text-foreground">{lvl.name}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit level ${lvl.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenLevelModal(lvl)}
                            disabled={isFallback}
                          >
                            <Edit2 className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete level ${lvl.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
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
                            <Trash2 className="size-3.5" aria-hidden="true" />
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

      {/* Subject Modal */}
      <Dialog open={Boolean(subjectModal)} onOpenChange={(nextOpen) => !nextOpen && setSubjectModal(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card p-5 shadow-modal">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="font-semibold text-sm text-foreground">
              {subjectModal?.mode === "edit" ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubjectSubmit} className="flex flex-col gap-3 text-xs">
            <div>
              <label htmlFor="subject-code-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Code
              </label>
              <Input
                id="subject-code-input"
                type="text"
                placeholder="e.g. PHYSICS"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                required
              />
            </div>
            <div>
              <label htmlFor="subject-name-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Name
              </label>
              <Input
                id="subject-name-input"
                type="text"
                placeholder="e.g. Physics"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSubjectModal(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}>
                Save Subject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Level Modal */}
      <Dialog open={Boolean(levelModal)} onOpenChange={(nextOpen) => !nextOpen && setLevelModal(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card p-5 shadow-modal">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="font-semibold text-sm text-foreground">
              {levelModal?.mode === "edit" ? "Edit Level" : "Add Educational Level"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLevelSubmit} className="flex flex-col gap-3 text-xs">
            <div>
              <label htmlFor="level-code-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Code
              </label>
              <Input
                id="level-code-input"
                type="text"
                placeholder="e.g. A_LEVEL"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                required
              />
            </div>
            <div>
              <label htmlFor="level-name-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Name
              </label>
              <Input
                id="level-name-input"
                type="text"
                placeholder="e.g. A Level"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLevelModal(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createLevelMutation.isPending || updateLevelMutation.isPending}>
                Save Level
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
