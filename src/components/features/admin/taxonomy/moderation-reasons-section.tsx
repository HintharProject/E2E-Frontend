"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  ShieldAlert,
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
        return <Badge variant="destructive" className="text-[10px] py-0">Critical</Badge>;
      case "HIGH_PRIORITY":
        return <Badge variant="warning" className="text-[10px] py-0">High</Badge>;
      case "NORMAL":
        return <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning text-[10px] py-0">Normal</Badge>;
      case "LOW":
      default:
        return <Badge variant="outline" className="border-chart-3/40 bg-chart-3/10 text-chart-3 text-[10px] py-0">Low</Badge>;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-warning" aria-hidden="true" />
          <h3 className="font-semibold text-foreground text-sm">Violation & Moderation Reasons</h3>
          <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
            {reasons.length}
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => handleOpenModal()}
        >
          <Plus className="size-3.5" aria-hidden="true" /> Add Violation Reason
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : reasons.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <ShieldAlert className="size-8 text-muted-foreground/50 mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">No violation reasons defined</p>
          <p className="text-xs text-muted-foreground mt-1">Configure moderation violation categories to classify reports.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/20 border-b border-border text-muted-foreground uppercase font-semibold text-[10px]">
              <tr>
                <th scope="col" className="p-3">Reason Code</th>
                <th scope="col" className="p-3">Label</th>
                <th scope="col" className="p-3">Description</th>
                <th scope="col" className="p-3 text-center">Default Severity</th>
                <th scope="col" className="p-3 text-center">Status</th>
                <th scope="col" className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reasons.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-muted-foreground text-[11px]">{r.code}</td>
                  <td className="p-3 font-semibold text-foreground">{r.label}</td>
                  <td className="p-3 text-muted-foreground max-w-xs truncate">{r.description || "—"}</td>
                  <td className="p-3 text-center">{getSeverityBadge(r.default_severity)}</td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => updateReasonMutation.mutate({ id: r.id, data: { is_active: !r.is_active } })}
                      aria-label={`Toggle ${r.label} status`}
                      className="inline-flex items-center gap-1 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {r.is_active ? (
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
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit reason ${r.label}`}
                        className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenModal(r)}
                      >
                        <Edit2 className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete reason ${r.label}`}
                        className="min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                        <Trash2 className="size-3.5" aria-hidden="true" />
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
      <Dialog open={Boolean(modal)} onOpenChange={(nextOpen) => !nextOpen && setModal(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-5 shadow-modal">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="font-semibold text-sm text-foreground">
              {modal?.mode === "edit" ? "Edit Violation Reason" : "Add Violation Reason"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
            <div>
              <label htmlFor="reason-code-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Reason Code (uppercase, e.g. SPAM_OR_COMMERCIAL)
              </label>
              <Input
                id="reason-code-input"
                type="text"
                placeholder="e.g. COPYRIGHT_INFRINGEMENT"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                className="font-mono"
                required
              />
            </div>
            <div>
              <label htmlFor="reason-label-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Display Label
              </label>
              <Input
                id="reason-label-input"
                type="text"
                placeholder="e.g. Copyright Infringement"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="reason-severity-select" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Default Severity
              </label>
              <Select
                id="reason-severity-select"
                sizeVariant="sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as "LOW" | "NORMAL" | "HIGH_PRIORITY" | "CRITICAL")}
              >
                <option value="LOW">Low (Minor infractions, formatting issues)</option>
                <option value="NORMAL">Normal (Standard community guidelines)</option>
                <option value="HIGH_PRIORITY">High Priority (Harassment, trolling, piracy)</option>
                <option value="CRITICAL">Critical (Severe abuse, security threats)</option>
              </Select>
            </div>
            <div>
              <label htmlFor="reason-description-input" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Description / Staff Guidance
              </label>
              <textarea
                id="reason-description-input"
                rows={3}
                placeholder="Explanation of when this reason applies..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
              />
            </div>
            <DialogFooter className="pt-2">
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
          isLoading={deleteReasonMutation.isPending}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
        />
      )}
    </div>
  );
}
