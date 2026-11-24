"use client";

import React, { useState } from "react";
import { useAdminAdjustPoints } from "@/hooks/use-contribution";
import { ContributorTier } from "@/types/contribution";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export interface PointAdjustmentModalProps {
  user: {
    id: string;
    display_name: string;
    contributor_tier?: ContributorTier | null;
    contribution_points?: number;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const PRESET_REASONS = [
  "Plagiarism Penalization",
  "Community Contest Reward",
  "Spam Cleanup",
  "Content Quality Bonus",
  "Manual System Audit Correction",
  "Other",
];

export function PointAdjustmentModal({
  user,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: PointAdjustmentModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
  };

  const [delta, setDelta] = useState<number>(0);
  const [reasonCategory, setReasonCategory] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");

  const adjustMutation = useAdminAdjustPoints();

  const currentPoints = user.contribution_points ?? 0;
  const newBalance = Math.max(0, currentPoints + delta);

  const finalReason = reasonCategory === "Other" ? customReason : `${reasonCategory}${customReason ? `: ${customReason}` : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (delta === 0) {
      toast.error("Point delta cannot be zero.");
      return;
    }

    if (!finalReason.trim()) {
      toast.error("Please provide a valid reason for the adjustment.");
      return;
    }

    adjustMutation.mutate(
      {
        user_id: user.id,
        delta,
        reason: finalReason,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setDelta(0);
          setCustomReason("");
          setNotes("");
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger
          render={
            React.isValidElement(trigger) ? (
              trigger
            ) : (
              <button type="button">{trigger}</button>
            )
          }
        />
      ) : !isControlled ? (
        <DialogTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-rose-600 border-rose-500/30">
              <ShieldAlert className="size-3.5" /> Adjust Points
            </Button>
          }
        />
      ) : null}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              Adjust Contributor Points
            </DialogTitle>
            <DialogDescription>
              Directly credit or deduct points from this user's contribution ledger. An immutable audit record will be created.
            </DialogDescription>
          </DialogHeader>

          {/* User Preview */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
            <div>
              <div className="font-heading font-semibold text-foreground">{user.display_name}</div>
              <div className="text-xs text-muted-foreground">User ID: {user.id.slice(0, 8)}...</div>
            </div>
            <div className="flex items-center gap-2">
              <ContributorBadge tier={user.contributor_tier} size="sm" />
              <span className="font-mono tabular-nums text-xs font-bold text-foreground">
                {currentPoints.toLocaleString()} pts
              </span>
            </div>
          </div>

          {/* Point Delta Input & Presets */}
          <div className="space-y-2">
            <label htmlFor="point-delta-input" className="text-xs font-semibold text-foreground">
              Point Delta (±Δ)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="point-delta-input"
                type="number"
                value={delta === 0 ? "" : delta}
                onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
                placeholder="Enter positive or negative integer"
                className="font-mono"
                required
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {[10, 50, 100, -10, -50, -100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDelta(preset)}
                  className={`rounded-md border px-2 py-1 min-h-[32px] font-mono tabular-nums text-[11px] font-semibold transition-colors cursor-pointer ${
                    preset > 0
                      ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }`}
                >
                  {preset > 0 ? `+${preset}` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Live Balance Preview */}
          <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-2.5 text-xs">
            <span className="text-muted-foreground">
              Current: <strong className="font-mono tabular-nums text-foreground">{currentPoints} pts</strong>
            </span>
            <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="font-bold text-foreground">
              New:{" "}
              <span className={`font-mono tabular-nums ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
                {newBalance} pts
              </span>
            </span>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label htmlFor="point-reason-select" className="text-xs font-semibold text-foreground">
              Reason (Required for Audit Log)
            </label>
            <Select
              id="point-reason-select"
              sizeVariant="sm"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="point-custom-reason" className="text-xs font-semibold text-foreground">
              Additional Details / Description
            </label>
            <Input
              id="point-custom-reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Verified duplicated answer on problem #849"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="point-internal-notes" className="text-xs font-semibold text-foreground">
              Internal Ticket / Notes (Optional)
            </label>
            <Input
              id="point-internal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. MOD-2026-894"
              className="font-mono"
            />
          </div>

          <DialogFooter className="pt-2">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={adjustMutation.isPending || delta === 0}
              variant={delta < 0 ? "destructive" : "default"}
            >
              {adjustMutation.isPending ? "Applying..." : "Confirm Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
