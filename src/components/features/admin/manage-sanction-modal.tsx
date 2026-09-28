"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BanState, isAdminOrSuperAdmin } from "@/types/user";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AlertTriangle, ShieldCheck, Check, Loader2, Clock, Ban } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SanctionTargetUser {
  id: string;
  display_name: string;
  email?: string;
  ban_status?: BanState;
  ban_expires_at?: string | null;
}

interface ManageSanctionModalProps {
  user: SanctionTargetUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialStatus?: BanState;
}

const SANCTION_OPTIONS: {
  status: BanState;
  label: string;
  description: string;
  durationInfo?: string;
  isDestructive?: boolean;
}[] = [
  {
    status: "ACTIVE",
    label: "Active (Clear All Sanctions)",
    description: "Restore full write access and remove active suspensions.",
  },
  {
    status: "WARNING",
    label: "Issue Warning",
    description: "Issue an official moderation warning recorded in user history without restricting account capabilities.",
  },
  {
    status: "BANNED_24H",
    label: "24-Hour Suspension",
    description: "Temporarily block asking, answering, and forum submissions.",
    durationInfo: "Expires automatically in 24 hours",
    isDestructive: true,
  },
  {
    status: "BANNED_7D",
    label: "7-Day Suspension",
    description: "Temporarily block asking, answering, and forum submissions.",
    durationInfo: "Expires automatically in 7 days",
    isDestructive: true,
  },
  {
    status: "PERMANENT_BAN",
    label: "Permanent Suspension",
    description: "Indefinitely revoke write, post, and comment permissions across the platform.",
    isDestructive: true,
  },
];

export function ManageSanctionModal({
  user,
  open,
  onOpenChange,
  onSuccess,
  initialStatus,
}: ManageSanctionModalProps) {
  const { getToken } = useAuth();
  const { user: currentUser } = useCurrentUser();
  const isAdmin = isAdminOrSuperAdmin(currentUser?.role);
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<BanState>("ACTIVE");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (initialStatus) {
      setSelectedStatus(initialStatus);
    } else if (user?.ban_status) {
      setSelectedStatus(user.ban_status);
    } else {
      setSelectedStatus("ACTIVE");
    }
    setReason("");
  }, [user, open, initialStatus]);

  const updateBanMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user selected");
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      return apiFetch(`/users/${user.id}/ban/`, token, {
        method: "PATCH",
        body: JSON.stringify({
          ban_status: selectedStatus,
          reason: reason.trim(),
        }),
      });
    },
    onSuccess: () => {
      toast.success(`Sanction status updated to ${selectedStatus} for ${user?.display_name}`);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.data?.error?.message || err?.message || "Failed to update sanction status.";
      toast.error(msg);
    },
  });

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("An audit reason is required when modifying user sanction status.");
      return;
    }

    if (selectedStatus === user.ban_status) {
      toast.info(`User already has sanction status ${selectedStatus}.`);
      onOpenChange(false);
      return;
    }

    updateBanMutation.mutate();
  };

  const isChangingToDestructive =
    selectedStatus === "BANNED_24H" ||
    selectedStatus === "BANNED_7D" ||
    selectedStatus === "PERMANENT_BAN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="size-5 text-destructive" />
              Manage User Sanction
            </DialogTitle>
            <DialogDescription>
              Apply, elevate, or lift disciplinary sanctions with automated expiration and audit logging.
            </DialogDescription>
          </DialogHeader>

          {/* User Preview */}
          <div className="rounded-xl border border-line bg-muted/30 p-3 text-xs">
            <div className="font-semibold text-ink">{user.display_name}</div>
            {user.email ? <div className="text-ink-muted">{user.email}</div> : null}
            <div className="mt-1 text-ink-muted">
              Current Status: <span className="font-semibold text-ink">{user.ban_status || "ACTIVE"}</span>
            </div>
          </div>

          {/* Sanction Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink">Sanction Level</label>
            <div className="grid gap-2">
              {SANCTION_OPTIONS.filter((opt) => isAdmin || opt.status !== "PERMANENT_BAN").map((opt) => {
                const isSelected = selectedStatus === opt.status;

                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setSelectedStatus(opt.status)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? opt.isDestructive
                          ? "border-destructive bg-destructive/5 text-ink ring-1 ring-destructive/20"
                          : "border-primary bg-primary/5 text-ink ring-1 ring-primary/20"
                        : "border-line bg-card hover:bg-muted/40 text-ink-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        isSelected
                          ? opt.isDestructive
                            ? "border-destructive bg-destructive text-destructive-foreground"
                            : "border-primary bg-primary text-primary-foreground"
                          : "border-line bg-surface"
                      )}
                    >
                      {isSelected && <Check className="size-2.5" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        {opt.label}
                        {opt.durationInfo && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-normal">
                            <Clock className="size-2.5" />
                            {opt.durationInfo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-ink-muted">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Reason (Mandatory) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink flex items-center justify-between">
              <span>Audit Reason <span className="text-destructive">*</span></span>
              <span className="text-[10px] text-ink-muted">Required for compliance</span>
            </label>
            <Input
              required
              placeholder="e.g. Inappropriate conduct on forum post, repeated unsolicited spam..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs"
              maxLength={500}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateBanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={isChangingToDestructive ? "destructive" : "default"}
              disabled={updateBanMutation.isPending || !reason.trim() || selectedStatus === user.ban_status}
              className="gap-1.5"
            >
              {updateBanMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isChangingToDestructive ? (
                <Ban className="size-3.5" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              {selectedStatus === "ACTIVE" ? "Lift Sanctions" : "Apply Sanction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
