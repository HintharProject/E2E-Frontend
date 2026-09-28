"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReport } from "@/hooks/use-interactions";
import { useModerationReasons } from "@/hooks/use-exam-taxonomy";
import { Flag, ShieldAlert, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: "POST" | "LESSON" | "USER" | "PROBLEM" | "SOLUTION" | "COMMENT";
  targetTitle?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS: {
  value: string;
  label: string;
  description: string;
}[] = [
  {
    value: "SPAM",
    label: "Spam or Commercial Promotion",
    description: "Advertising, promotional links, or repeated unsolicited content.",
  },
  {
    value: "HARASSMENT",
    label: "Harassment or Abusive Behavior",
    description: "Personal attacks, hate speech, bullying, or targeted threats.",
  },
  {
    value: "INAPPROPRIATE_CONTENT",
    label: "Inappropriate or Offensive Content",
    description: "Profanity, vulgar language, or sexually suggestive material.",
  },
  {
    value: "CHEATING_ACADEMIC_DISHONESTY",
    label: "Cheating / Academic Dishonesty",
    description: "Leaked exam questions, homework answer fraud, or exam leaks.",
  },
  {
    value: "COPYRIGHT_VIOLATION",
    label: "Copyright Violation",
    description: "Unauthorized reproduction of proprietary textbook or exam assets.",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Any other community violation not covered above.",
  },
];

export function ReportModal({
  open,
  onOpenChange,
  targetId,
  targetType,
  targetTitle,
  onSuccess,
}: ReportModalProps) {
  const { data: dbReasons } = useModerationReasons();
  const activeReasons = useMemo(() => {
    if (dbReasons && dbReasons.length > 0) {
      const active = dbReasons.filter((r) => r.is_active);
      if (active.length > 0) {
        return active.map((r) => ({
          value: r.code,
          label: r.label,
          description: r.description,
        }));
      }
    }
    return REPORT_REASONS;
  }, [dbReasons]);

  const [selectedReason, setSelectedReason] = useState<string>("SPAM");
  const [otherDescription, setOtherDescription] = useState<string>("");
  const reportMutation = useReport();


  const handleClose = () => {
    setSelectedReason("SPAM");
    setOtherDescription("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (selectedReason === "OTHER" && !otherDescription.trim()) {
      toast.error("Please enter a brief description for this report.");
      return;
    }

    try {
      await reportMutation.mutateAsync({
        targetId,
        targetType,
        reason: selectedReason,
        notes: selectedReason === "OTHER" ? otherDescription.trim() : undefined,
      });

      toast.success("Report submitted to moderation queue. Thank you.");
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to submit report.";
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-6 bg-card border-line shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="size-5" />
            <DialogTitle className="text-lg font-bold text-ink">
              Report Content
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink-muted">
            Help maintain our academic integrity and community standards. Select the
            primary reason for flagging this {targetType.toLowerCase()}
            {targetTitle ? ` ("${targetTitle}")` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            {activeReasons.map((r) => {
              const isSelected = selectedReason === r.value;

              return (
                <div
                  key={r.value}
                  onClick={() => setSelectedReason(r.value)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    isSelected
                      ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/20"
                      : "border-line bg-muted/20 hover:bg-muted/40 hover:border-line/80"
                  )}
                >
                  <div
                    className={cn(
                      "size-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-line bg-background"
                    )}
                  >
                    {isSelected && <Check className="size-2.5 stroke-[3]" />}
                  </div>
                  <div className="space-y-0.5 select-none">
                    <div className="text-xs font-semibold text-ink">
                      {r.label}
                    </div>
                    <div className="text-[11px] text-ink-muted leading-relaxed">
                      {r.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conditional Description for "Other" */}
          {selectedReason === "OTHER" && (
            <div className="space-y-1.5 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">
                  Reason Description <span className="text-rose-500">*</span>
                </span>
                <span
                  className={cn(
                    "text-[11px]",
                    otherDescription.length > 120
                      ? "text-rose-500 font-bold"
                      : "text-ink-muted"
                  )}
                >
                  {otherDescription.length}/120
                </span>
              </div>
              <textarea
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value.slice(0, 120))}
                rows={3}
                placeholder="Briefly describe what makes this content problematic..."
                className="w-full rounded-xl border border-line bg-background p-3 text-xs text-ink placeholder:text-ink-muted/60 focus:outline-hidden focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between pt-3 border-t border-line">
          <p className="text-[11px] text-ink-muted">
            Reports are confidential and reviewed by staff.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={reportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleSubmit}
              disabled={
                reportMutation.isPending ||
                (selectedReason === "OTHER" && !otherDescription.trim())
              }
              className="gap-1.5"
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="size-3.5" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
