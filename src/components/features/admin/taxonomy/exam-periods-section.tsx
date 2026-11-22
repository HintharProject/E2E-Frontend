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
  Calendar,
  Layers3,
} from "lucide-react";
import {
  useExamYears,
  useCreateExamYear,
  useUpdateExamYear,
  useDeleteExamYear,
  useExamSessions,
  useCreateExamSession,
  useUpdateExamSession,
  useDeleteExamSession,
  ExamSessionItem,
} from "@/hooks/use-exam-taxonomy";
import { formatYear } from "@/lib/resources";
import { ConfirmDialog } from "./confirm-dialog";

export function ExamPeriodsSection() {
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" aria-hidden="true" />
            <h3 className="font-semibold text-foreground text-sm">Exam Years</h3>
            <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
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
            <Plus className="size-3.5" aria-hidden="true" /> Add Year
          </Button>
        </div>

        {isYearsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase font-semibold text-[10px]">
                <tr>
                  <th scope="col" className="p-3">Year</th>
                  <th scope="col" className="p-3 text-center">Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {years.map((y) => {
                  const isFallbackYear = String(y.year).toLowerCase() === "others" || y.year === 0;
                  return (
                    <tr key={y.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-mono tabular-nums font-semibold text-foreground text-sm">
                        <div className="flex items-center gap-2">
                          <span>{formatYear(y.year)}</span>
                          {isFallbackYear && (
                            <Badge variant="warning" className="text-[10px] font-medium">
                              Fallback
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => updateYearMutation.mutate({ id: y.id, data: { is_active: !y.is_active } })}
                          aria-label={`Toggle year ${formatYear(y.year)} status`}
                          className="inline-flex items-center gap-1 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {y.is_active ? (
                            <Badge variant="default" className="text-[10px] py-0">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] py-0 text-muted-foreground hover:bg-muted">
                              Inactive
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        {isFallbackYear ? (
                          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                            Protected
                          </Badge>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete year ${formatYear(y.year)}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam Sessions */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers3 className="size-4 text-chart-4" aria-hidden="true" />
            <h3 className="font-semibold text-foreground text-sm">Exam Sessions</h3>
            <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
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
            <Plus className="size-3.5" aria-hidden="true" /> Add Session
          </Button>
        </div>

        {isSessionsLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase font-semibold text-[10px]">
                <tr>
                  <th scope="col" className="p-3">Code</th>
                  <th scope="col" className="p-3">Display Name</th>
                  <th scope="col" className="p-3 text-center">Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-muted-foreground text-[11px]">
                      <div className="flex items-center gap-2">
                        <span>{sess.code}</span>
                        {sess.code === "OTHERS" && (
                          <Badge variant="warning" className="text-[10px] font-medium">
                            Fallback
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-foreground">{sess.name}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => updateSessionMutation.mutate({ id: sess.id, data: { is_active: !sess.is_active } })}
                        aria-label={`Toggle session ${sess.name} status`}
                        className="inline-flex items-center gap-1 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {sess.is_active ? (
                          <Badge variant="default" className="text-[10px] py-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] py-0 text-muted-foreground hover:bg-muted">
                            Inactive
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      {sess.code === "OTHERS" ? (
                        <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                          Protected
                        </Badge>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit session ${sess.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSessionModal({ mode: "edit", item: sess });
                              setSessionCode(sess.code);
                              setSessionName(sess.name);
                            }}
                          >
                            <Edit2 className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete session ${sess.name}`}
                            className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Year Modal */}
      <Dialog open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
        <DialogContent className="sm:max-w-xs rounded-2xl border-border bg-card p-5 shadow-modal">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="font-semibold text-sm text-foreground">Add Exam Year</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddYear} className="flex flex-col gap-3 text-xs">
            <div>
              <label htmlFor="exam-year-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Year (e.g. 2027 or others)
              </label>
              <Input
                id="exam-year-input"
                type="text"
                placeholder="e.g. 2027"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddYearOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createYearMutation.isPending || !yearInput}>
                Save Year
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Modal */}
      <Dialog open={Boolean(sessionModal)} onOpenChange={(nextOpen) => !nextOpen && setSessionModal(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card p-5 shadow-modal">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="font-semibold text-sm text-foreground">
              {sessionModal?.mode === "edit" ? "Edit Exam Session" : "Add Exam Session"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSessionSubmit} className="flex flex-col gap-3 text-xs">
            <div>
              <label htmlFor="session-code-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Session Code (e.g. MAY_JUNE)
              </label>
              <Input
                id="session-code-input"
                type="text"
                placeholder="e.g. FEB_MARCH"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                className="font-mono"
                required
              />
            </div>
            <div>
              <label htmlFor="session-name-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Display Label (e.g. May / June)
              </label>
              <Input
                id="session-name-input"
                type="text"
                placeholder="e.g. Feb / March"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
