"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDeleteProblem } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isModeratorOrAbove } from "@/types/user";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProblemAuthorActions({
  problemId,
  isFinal = false,
}: {
  problemId: string;
  isFinal?: boolean;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isStaff = isModeratorOrAbove(user?.role);
  const deleteMutation = useDeleteProblem();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [auditReason, setAuditReason] = useState("");

  const handleDelete = () => {
    if (isFinal && !isStaff) {
      toast.error("Finalized problems cannot be deleted by users. Contact staff moderation.");
      setOpen(false);
      return;
    }

    if (isFinal && isStaff && !auditReason.trim()) {
      toast.error("An audit reason is required for staff override deletion.");
      return;
    }

    setOpen(false);
    router.push("/problems");

    toast.promise(
      deleteMutation.mutateAsync(
        isFinal && isStaff
          ? { problemId, reason: auditReason.trim() }
          : problemId
      ),
      {
        loading: isFinal && isStaff ? "Staff overriding finality & deleting..." : "Deleting problem...",
        success: () => {
          router.refresh();
          return isFinal && isStaff
            ? "Problem override-deleted; milestone bonuses reconciled."
            : "Problem deleted successfully";
        },
        error: (err: any) => err?.message || "Failed to delete problem. Please try again.",
      }
    );
  };

  const canDelete = !isFinal || isStaff;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setAuditReason("");
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>
        {isFinal && isStaff ? "Staff Delete" : "Delete Problem"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isFinal && isStaff ? "Staff Override Delete Problem" : "Delete Problem"}
          </DialogTitle>
          <DialogDescription>
            {isFinal && isStaff
              ? "This problem has reached Verified Consensus Finality. As a staff moderator/admin, confirming deletion will override finality, remove the problem, and automatically reconcile milestone bonus points (-10 pts)."
              : isFinal
              ? "This problem has reached Verified Consensus Finality. Finalized problems cannot be deleted by authors."
              : "Are you sure you want to delete this problem? Any milestone bonuses will be reconciled and this action cannot be undone."}
          </DialogDescription>
        </DialogHeader>

        {isFinal && isStaff && (
          <div className="space-y-1.5 py-2">
            <label className="text-xs font-semibold text-ink">
              Audit Reason <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Reason for overriding consensus finality..."
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              className="text-xs h-9"
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || (isFinal && isStaff && !auditReason.trim())}
            >
              {isDeleting ? "Deleting..." : isFinal && isStaff ? "Confirm Staff Override Delete" : "Confirm Delete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
