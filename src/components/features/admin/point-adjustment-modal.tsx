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
}

const PRESET_REASONS = [
  "Plagiarism Penalization",
  "Community Contest Reward",
  "Spam Cleanup",
  "Content Quality Bonus",
  "Manual System Audit Correction",
  "Other",
];

export function PointAdjustmentModal({ user, trigger }: PointAdjustmentModalProps) {
  const [open, setOpen] = useState(false);
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
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            <>{trigger}</>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-rose-600 border-rose-500/30">
              <ShieldAlert className="size-3.5" /> Adjust Points
            </Button>
          )
        }
      />
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
          <div className="flex items-center justify-between rounded-xl border border-line bg-muted/40 p-3">
            <div>
              <div className="font-heading font-semibold text-ink">{user.display_name}</div>
              <div className="text-xs text-ink-muted">User ID: {user.id.slice(0, 8)}...</div>
            </div>
            <div className="flex items-center gap-2">
              <ContributorBadge tier={user.contributor_tier} size="sm" />
              <span className="font-mono text-xs font-bold text-ink">
                {currentPoints.toLocaleString()} pts
              </span>
            </div>
          </div>

          {/* Point Delta Input & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink">
              Point Delta ($\pm\Delta$)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={delta === 0 ? "" : delta}
                onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
                placeholder="Enter positive or negative integer"
                className="font-mono text-sm"
                required
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              {[10, 50, 100, -10, -50, -100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDelta(preset)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                    preset > 0
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                  {preset > 0 ? `+${preset}` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Live Balance Preview */}
          <div className="flex items-center justify-center gap-3 rounded-xl border border-line bg-card p-2.5 text-xs">
            <span className="text-ink-muted">Current: <strong>{currentPoints} pts</strong></span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span className="font-bold text-ink">
              New: <span className={delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{newBalance} pts</span>
            </span>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">
              Reason (Required for Audit Log)
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">
              Additional Details / Description
            </label>
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Verified duplicated answer on problem #849"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">
              Internal Ticket / Notes (Optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. MOD-2026-894"
              className="text-xs font-mono"
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
