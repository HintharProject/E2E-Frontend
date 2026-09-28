"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  useModerationReasons,
  useCreateModerationReason,
  useUpdateModerationReason,
  useDeleteModerationReason,
  ModerationReasonItem,
} from "@/hooks/use-exam-taxonomy";
import { ConfirmDialog } from "./confirm-dialog";

export function ModerationReasonsSection() {
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
