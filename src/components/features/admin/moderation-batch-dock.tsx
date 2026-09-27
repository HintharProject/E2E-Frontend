"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";

interface ModerationBatchDockProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess?: () => void;
}

export function ModerationBatchDock({
  selectedIds,
  onClearSelection,
  onSuccess,
}: ModerationBatchDockProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<"RESOLVE" | "DISMISS" | "TAKEDOWN">("RESOLVE");
  const [takedownType, setTakedownType] = useState<"soft_delete" | "hide" | "lock">("soft_delete");
  const [reason, setReason] = useState("");

  const batchMutation = useMutation({
    mutationFn: async ({
      action,
      takedown_action,
      reason,
    }: {
      action: "RESOLVE" | "DISMISS" | "TAKEDOWN";
      takedown_action?: "soft_delete" | "hide" | "lock";
      reason?: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<{ success: boolean; processed_count: number }>(
        `/reports/batch/`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            report_ids: selectedIds,
            action,
            takedown_action,
            reason,
          }),
        }
      );
    },
    onSuccess: (data) => {
      toast.success(`Successfully processed ${data.processed_count} reports`);
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReportsCounts"] });
      onClearSelection();
      setDialogOpen(false);
      setReason("");
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to process batch moderation action";
      toast.error(msg);
    },
  });

  if (selectedIds.length === 0) return null;

  function openActionDialog(action: "RESOLVE" | "DISMISS" | "TAKEDOWN") {
    setBatchAction(action);
    setReason("");
    setDialogOpen(true);
  }

  function handleConfirm() {
    batchMutation.mutate({
      action: batchAction,
      takedown_action: batchAction === "TAKEDOWN" ? takedownType : undefined,
      reason: reason.trim() || undefined,
    });
  }

  return (
    <>
      {/* Floating Action Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border border-line shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-line text-sm">
          <span className="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {selectedIds.length}
          </span>
          <span className="font-semibold text-ink">Selected</span>
          <button
            onClick={onClearSelection}
            className="text-xs text-ink-muted hover:text-ink underline ml-1"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openActionDialog("DISMISS")}
            disabled={batchMutation.isPending}
            className="h-9 px-3 text-xs"
          >
            <XCircle className="size-3.5 mr-1.5 text-ink-muted" /> Bulk Dismiss
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => openActionDialog("TAKEDOWN")}
            disabled={batchMutation.isPending}
            className="h-9 px-3 text-xs font-medium"
          >
            <Trash2 className="size-3.5 mr-1.5" /> Bulk Takedown
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={() => openActionDialog("RESOLVE")}
            disabled={batchMutation.isPending}
            className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <CheckCircle2 className="size-3.5 mr-1.5" /> Bulk Resolve
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {batchAction === "RESOLVE" && `Resolve ${selectedIds.length} Reports`}
              {batchAction === "DISMISS" && `Dismiss ${selectedIds.length} Reports`}
              {batchAction === "TAKEDOWN" && `Bulk Takedown & Resolve ${selectedIds.length} Items`}
            </DialogTitle>
            <DialogDescription>
              {batchAction === "RESOLVE" &&
                "Mark all selected reports as resolved. An audit log will be created for each item."}
              {batchAction === "DISMISS" &&
                "Dismiss selected reports as invalid or false positives. This will clear them from the pending queue."}
              {batchAction === "TAKEDOWN" &&
                "Select a takedown action to execute across the reported target items."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {batchAction === "TAKEDOWN" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink">Takedown Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTakedownType("soft_delete")}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      takedownType === "soft_delete"
                        ? "border-destructive bg-destructive/10 text-destructive font-bold"
                        : "border-line bg-card hover:bg-muted/40 text-ink"
                    }`}
                  >
                    Soft Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setTakedownType("hide")}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      takedownType === "hide"
                        ? "border-brand bg-brand/10 text-brand font-bold"
                        : "border-line bg-card hover:bg-muted/40 text-ink"
                    }`}
                  >
                    Hide Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setTakedownType("lock")}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      takedownType === "lock"
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 font-bold"
                        : "border-line bg-card hover:bg-muted/40 text-ink"
                    }`}
                  >
                    Lock Content
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Audit Reason / Note (Optional)
              </label>
              <Input
                placeholder="Reason recorded in platform audit logs..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={batchMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={batchAction === "TAKEDOWN" ? "destructive" : "default"}
              className={
                batchAction === "RESOLVE"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  : ""
              }
              onClick={handleConfirm}
              disabled={batchMutation.isPending}
            >
              {batchMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" /> Processing...
                </>
              ) : (
                "Confirm & Execute"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
