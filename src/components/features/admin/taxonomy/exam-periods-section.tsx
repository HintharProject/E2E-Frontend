"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers3,
  X,
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
