"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { MathRenderer } from "@/components/ui/math-renderer";
import {
  useCreateAnnouncement,
  useUpdateAnnouncement,
  type Announcement,
} from "@/hooks/use-announcements";
import {
  Megaphone,
  Clock,
  Eye,
  Edit3,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementDialogProps {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AnnouncementDialog({
  announcement,
  open,
  onOpenChange,
  onSuccess,
}: AnnouncementDialogProps) {
  const isEditing = !!announcement;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tab, setTab] = useState<"write" | "preview">("write");

  // Expiry handling
  const [expiryOption, setExpiryOption] = useState<"never" | "1d" | "3d" | "7d" | "30d" | "custom">("never");
  const [customDateTime, setCustomDateTime] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (announcement) {
        setTitle(announcement.title);
        setBody(announcement.body);
        setIsActive(announcement.is_active);
        setTab("write");
        setValidationError(null);

        if (announcement.expires_at) {
          setExpiryOption("custom");
          // Convert ISO string to YYYY-MM-DDTHH:mm format for input
          const d = new Date(announcement.expires_at);
          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setCustomDateTime(localIso);
        } else {
          setExpiryOption("never");
          setCustomDateTime("");
        }
      } else {
        // Reset defaults
        setTitle("");
        setBody("");
        setIsActive(true);
        setTab("write");
        setExpiryOption("never");
        setCustomDateTime("");
        setValidationError(null);
      }
    }
  }, [open, announcement]);

  const calculateExpiresAt = (): string | null => {
    if (expiryOption === "never") return null;

    const now = new Date();
    if (expiryOption === "1d") {
      now.setDate(now.getDate() + 1);
      return now.toISOString();
    }
    if (expiryOption === "3d") {
      now.setDate(now.getDate() + 3);
      return now.toISOString();
    }
    if (expiryOption === "7d") {
      now.setDate(now.getDate() + 7);
      return now.toISOString();
    }
    if (expiryOption === "30d") {
      now.setDate(now.getDate() + 30);
      return now.toISOString();
    }
    if (expiryOption === "custom") {
      if (!customDateTime) return null;
      const parsed = new Date(customDateTime);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString();
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      setValidationError("Please enter an announcement title.");
      return;
    }
    if (trimmedTitle.length > 100) {
      setValidationError("Title must be 100 characters or fewer.");
      return;
    }
    if (!trimmedBody) {
      setValidationError("Announcement message body cannot be blank.");
      return;
    }
    if (trimmedBody.length > 3000) {
      setValidationError("Body cannot exceed 3,000 characters.");
      return;
    }

    const expiresAt = calculateExpiresAt();

    if (expiryOption === "custom" && customDateTime) {
      const parsed = new Date(customDateTime);
      if (parsed.getTime() <= Date.now()) {
        setValidationError("Custom expiry date must be in the future.");
        return;
      }
    }

    try {
      if (isEditing && announcement) {
        await updateMutation.mutateAsync({
          id: announcement.id,
          data: {
            title: trimmedTitle,
            body: trimmedBody,
            is_active: isActive,
            expires_at: expiresAt,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: trimmedTitle,
          body: trimmedBody,
          is_active: isActive,
          expires_at: expiresAt,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Handled by mutation onError toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-line">
        <DialogHeader className="p-6 pb-4 border-b border-line bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Megaphone className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-ink">
                {isEditing ? "Edit Global Announcement" : "Create Global Announcement"}
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-muted mt-0.5">
                Broadcast platform banners and notices across student and staff dashboards.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {validationError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-center gap-2.5 text-xs text-destructive font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-ink">
                  Title <span className="text-destructive">*</span>
                </label>
                <span className={cn("text-[11px] tabular-nums", title.length > 90 ? "text-amber-500 font-bold" : "text-ink-muted")}>
                  {title.length}/100
                </span>
              </div>
              <Input
                type="text"
                placeholder="e.g. Cambridge May/June 2026 Examination Revision Season Kickoff"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="text-sm font-medium"
                autoFocus
              />
            </div>

            {/* Body Field with Tabbed Markdown Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-ink">
                  Announcement Message <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTab("write")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1",
                      tab === "write" ? "bg-primary text-primary-foreground" : "text-ink-muted hover:text-ink"
                    )}
                  >
                    <Edit3 className="size-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("preview")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1",
                      tab === "preview" ? "bg-primary text-primary-foreground" : "text-ink-muted hover:text-ink"
                    )}
                  >
                    <Eye className="size-3" /> Preview
                  </button>
                </div>
              </div>

              {tab === "write" ? (
                <div className="relative">
                  <textarea
                    placeholder="Enter the announcement text. Supports standard text, bullet points, and LaTeX formulas (e.g. $E = mc^2$ or $$W = \Delta K$$)..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={3000}
                    rows={6}
                    required
                    className="w-full rounded-xl border border-input bg-card p-3 text-sm text-ink placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors resize-y leading-relaxed font-sans"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={cn("text-[11px] tabular-nums", body.length > 2800 ? "text-amber-500 font-bold" : "text-ink-muted")}>
                      {body.length}/3000
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-muted/15 p-4 min-h-[160px] text-sm text-ink leading-relaxed">
                  {body.trim() ? (
                    <MathRenderer content={body} />
                  ) : (
                    <span className="text-ink-muted italic text-xs">Nothing to preview yet. Write some text above.</span>
                  )}
                </div>
              )}
            </div>

            {/* Expiry Options */}
            <div className="space-y-2 pt-2 border-t border-line">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Clock className="size-3.5 text-primary" />
                <span>Expiration & Scheduling</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Choose when this announcement should automatically cease displaying in the student feed.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                {(
                  [
                    { id: "never", label: "Indefinite" },
                    { id: "1d", label: "24 Hours" },
                    { id: "3d", label: "3 Days" },
                    { id: "7d", label: "7 Days" },
                    { id: "30d", label: "30 Days" },
                    { id: "custom", label: "Custom..." },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExpiryOption(opt.id)}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center",
                      expiryOption === opt.id
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-line bg-card hover:bg-muted/40 text-ink-muted hover:text-ink"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {expiryOption === "custom" && (
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-ink-muted" />
                    <Input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="max-w-xs text-xs"
                      required={expiryOption === "custom"}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Active Status Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-ink">Publication Status</p>
                <p className="text-[11px] text-ink-muted">
                  {isActive
                    ? "Active — visible immediately to all users until expiration."
                    : "Draft / Inactive — hidden from student feeds."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5",
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/25"
                    : "bg-muted border-line text-ink-muted hover:text-ink"
                )}
              >
                <span
                  className={cn("size-2 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-ink-muted")}
                />
                {isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-line bg-card/60 backdrop-blur-xs flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="font-semibold">
              {isSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Announcement"
              ) : (
                "Publish Announcement"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
