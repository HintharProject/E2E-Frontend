"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Share2,
  Flag,
  Pencil,
  Trash2,
  Eye,
  Archive,
  EyeOff,
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  Coins,
  FileMinus,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { ReportModal } from "@/components/features/moderation/report-modal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isModeratorOrAbove, isAdminOrSuperAdmin, BanState } from "@/types/user";
import { useStaffActions, TakedownAction } from "@/hooks/use-staff-actions";
import { ManageSanctionModal, SanctionTargetUser } from "@/components/features/admin/manage-sanction-modal";
import { PointAdjustmentModal } from "@/components/features/admin/point-adjustment-modal";
import { StaffAuthorInfo } from "@/components/features/moderation/staff-content-action-menu";
import { cn } from "@/lib/utils";

type ContentType = "POST" | "LESSON" | "PROBLEM" | "SOLUTION";

export interface CardMoreMenuProps {
  /** The URL to share */
  shareUrl: string;
  /** The target type for the report API */
  contentType: ContentType;
  /** The ID of the content for the report API */
  contentId: string;
  /** Author details for staff moderation context */
  author?: StaffAuthorInfo | null;
  /** Whether item is currently hidden by staff */
  isHidden?: boolean;
  /** Whether discussion is locked by staff */
  isLocked?: boolean;
  /** For problems: whether marked final */
  isFinal?: boolean;
  /** If provided, shows an Edit option linking to this href */
  editHref?: string;
  /** If provided, shows a Delete option that calls this function */
  onDelete?: () => Promise<void>;
  /** Delete confirmation text */
  deleteLabel?: string;
  /** If provided, shows a Publish option (Lessons only) */
  onPublish?: () => Promise<void>;
  /** If provided, shows an Archive option (Lessons only) */
  onArchive?: () => Promise<void>;
}

interface PendingStaffActionConfig {
  action: TakedownAction;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  requiresReason?: boolean;
}

export function CardMoreMenu({
  shareUrl,
  contentType,
  contentId,
  author,
  isHidden = false,
  isLocked = false,
  isFinal = false,
  editHref,
  onDelete,
  deleteLabel = "this item",
  onPublish,
  onArchive,
}: CardMoreMenuProps) {
  const { user: currentUser } = useCurrentUser();
  const isStaff = isModeratorOrAbove(currentUser?.role);
  const isAdmin = isAdminOrSuperAdmin(currentUser?.role);

  const { takedownMutation, isPending: isStaffPending } = useStaffActions();

  // User Action Modals
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingState, setIsChangingState] = useState(false);

  // Staff Action Modals
  const [staffActionConfig, setStaffActionConfig] = useState<PendingStaffActionConfig | null>(null);
  const [staffReason, setStaffReason] = useState("");
  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);
  const [sanctionInitialStatus, setSanctionInitialStatus] = useState<BanState>("WARNING");
  const [pointModalOpen, setPointModalOpen] = useState(false);

  const targetUserForModal: SanctionTargetUser | null = author?.id
    ? {
        id: author.id,
        display_name: author.display_name || "Author",
        email: author.email,
        ban_status: author.ban_status || "ACTIVE",
        ban_expires_at: author.ban_expires_at || null,
      }
    : null;

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  }

  function handleReport(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setReportOpen(true);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handlePublish() {
    if (!onPublish) return;
    setIsChangingState(true);
    try {
      await onPublish();
      setPublishOpen(false);
    } finally {
      setIsChangingState(false);
    }
  }

  async function handleArchive() {
    if (!onArchive) return;
    setIsChangingState(true);
    try {
      await onArchive();
      setArchiveOpen(false);
    } finally {
      setIsChangingState(false);
    }
  }

  const handleExecuteStaffAction = async () => {
    if (!staffActionConfig) return;

    await takedownMutation.mutateAsync({
      target_id: contentId,
      target_type: contentType,
      action: staffActionConfig.action,
      reason: staffReason.trim() || `Staff action triggered by ${currentUser?.display_name}`,
    });

    setStaffActionConfig(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:opacity-100",
            isStaff
              ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/15"
              : "text-ink-muted hover:bg-muted hover:text-ink"
          )}
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-56 text-xs">
          {/* Share */}
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </DropdownMenuItem>

          {/* Report */}
          <DropdownMenuItem onClick={handleReport}>
            <Flag className="h-3.5 w-3.5" />
            Report
          </DropdownMenuItem>

          {/* Edit — only if authorized */}
          {editHref && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Link href={editHref} className="flex items-center gap-2 w-full">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* Publish — Lessons only */}
          {onPublish && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPublishOpen(true);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              Publish
            </DropdownMenuItem>
          )}

          {/* Archive — Lessons only */}
          {onArchive && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setArchiveOpen(true);
              }}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </DropdownMenuItem>
          )}

          {/* Delete — Author delete */}
          {onDelete && (
            <>
              {!editHref && !onPublish && !onArchive && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </>
          )}

          {/* ========================================================================= */}
          {/* STAFF MODERATION ACTIONS (Strictly isModeratorOrAbove)                      */}
          {/* ========================================================================= */}
          {isStaff && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                <Shield className="size-3" />
                <span>Staff Moderation</span>
              </DropdownMenuLabel>

              {/* Hide / Unhide */}
              {contentType !== "LESSON" && (
                <>
                  {isHidden ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStaffActionConfig({
                          action: "unhide",
                          title: `Unhide ${contentType}`,
                          description: `Make this ${contentType.toLowerCase()} publicly visible to all students again.`,
                          confirmLabel: "Unhide Item",
                        });
                      }}
                      className="gap-2 text-emerald-600 dark:text-emerald-400 font-medium"
                    >
                      <Eye className="size-3.5" />
                      <span>Unhide {contentType}</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStaffActionConfig({
                          action: "hide",
                          title: `Hide ${contentType}`,
                          description: `Hide this ${contentType.toLowerCase()} from public student feeds immediately. Only staff will see it.`,
                          confirmLabel: "Hide from Students",
                          isDestructive: true,
                        });
                      }}
                      className="gap-2 text-amber-600 dark:text-amber-400"
                    >
                      <EyeOff className="size-3.5" />
                      <span>Hide {contentType}</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {/* Lesson Delist vs Restore */}
              {contentType === "LESSON" && (
                isHidden ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setStaffActionConfig({
                        action: "restore",
                        title: "Restore Lesson to Published",
                        description: "Restore this lesson to Published status so students can view it.",
                        confirmLabel: "Restore Lesson",
                      });
                    }}
                    className="gap-2 text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <Eye className="size-3.5" />
                    <span>Restore to Published</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setStaffActionConfig({
                        action: "delist",
                        title: "Delist Lesson to Draft",
                        description: "Demote this lesson back to Draft status so students cannot view it.",
                        confirmLabel: "Delist to Draft",
                        isDestructive: true,
                      });
                    }}
                    className="gap-2 text-amber-600 dark:text-amber-400"
                  >
                    <FileMinus className="size-3.5" />
                    <span>Delist to Draft</span>
                  </DropdownMenuItem>
                )
              )}

              {/* Lock / Unlock */}
              {(contentType === "POST" || contentType === "PROBLEM") && (
                <>
                  {isLocked ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStaffActionConfig({
                          action: "unlock",
                          title: `Unlock Discussion`,
                          description: `Re-open comments and replies for this ${contentType.toLowerCase()}.`,
                          confirmLabel: "Unlock Thread",
                        });
                      }}
                      className="gap-2 text-emerald-600 dark:text-emerald-400"
                    >
                      <Unlock className="size-3.5" />
                      <span>Unlock Thread</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStaffActionConfig({
                          action: "lock",
                          title: `Lock Discussion`,
                          description: `Prevent students from submitting new comments or solutions to this ${contentType.toLowerCase()}.`,
                          confirmLabel: "Lock Thread",
                          isDestructive: true,
                        });
                      }}
                      className="gap-2 text-muted-foreground"
                    >
                      <Lock className="size-3.5" />
                      <span>Lock Discussion</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {/* Staff Soft Delete (even if not author) */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStaffActionConfig({
                    action: "soft_delete",
                    title: isFinal ? "Staff Override Delete" : `Staff Delete ${contentType}`,
                    description: isFinal
                      ? "This problem has finalized consensus. Your staff deletion overrides finality and automatically reconciles author milestone points."
                      : `Soft delete this ${contentType.toLowerCase()} and archive associated media/replies.`,
                    confirmLabel: "Confirm Deletion",
                    isDestructive: true,
                    requiresReason: true,
                  });
                }}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span>{isFinal ? "Staff Override Delete" : `Staff Delete ${contentType}`}</span>
              </DropdownMenuItem>

              {/* Author Sanctions */}
              {targetUserForModal && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSanctionInitialStatus("WARNING");
                      setSanctionModalOpen(true);
                    }}
                    className="gap-2 text-amber-600 dark:text-amber-400"
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>Warn Author</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSanctionInitialStatus("BANNED_24H");
                      setSanctionModalOpen(true);
                    }}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <ShieldAlert className="size-3.5" />
                    <span>Sanction / Suspend</span>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPointModalOpen(true);
                      }}
                      className="gap-2 text-primary"
                    >
                      <Coins className="size-3.5" />
                      <span>Adjust Points</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      {onDelete && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {deleteLabel}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deleteLabel}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Publish Confirmation Dialog */}
      {onPublish && (
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Lesson</DialogTitle>
              <DialogDescription>
                This lesson will become visible to all students. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={isChangingState}>
                Cancel
              </Button>
              <Button variant="default" onClick={handlePublish} disabled={isChangingState}>
                {isChangingState ? "Publishing..." : "Publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive Confirmation Dialog */}
      {onArchive && (
        <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive Lesson</DialogTitle>
              <DialogDescription>
                This lesson will no longer be listed for students. You can publish it again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={isChangingState}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleArchive} disabled={isChangingState}>
                {isChangingState ? "Archiving..." : "Archive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Staff Action Confirmation Dialog */}
      <Dialog
        open={!!staffActionConfig}
        onOpenChange={(open) => !open && setStaffActionConfig(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert
                className={cn(
                  "size-5",
                  staffActionConfig?.isDestructive ? "text-destructive" : "text-amber-500"
                )}
              />
              {staffActionConfig?.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-ink-muted">
              {staffActionConfig?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-line bg-muted/40 p-3 text-xs space-y-1">
              <div className="font-semibold text-ink">{deleteLabel}</div>
              {author?.display_name && (
                <div className="text-ink-muted">Author: {author.display_name}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Audit Reason {staffActionConfig?.requiresReason ? "(Mandatory)" : "(Optional)"}
              </label>
              <Input
                placeholder="Reason recorded in platform audit log..."
                value={staffReason}
                onChange={(e) => setStaffReason(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStaffActionConfig(null)}
              disabled={isStaffPending}
            >
              Cancel
            </Button>
            <Button
              variant={staffActionConfig?.isDestructive ? "destructive" : "default"}
              size="sm"
              onClick={handleExecuteStaffAction}
              disabled={isStaffPending || (staffActionConfig?.requiresReason && !staffReason.trim())}
              className="gap-1.5"
            >
              {isStaffPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>{staffActionConfig?.confirmLabel}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sanction Modal Adapter */}
      {targetUserForModal && (
        <ManageSanctionModal
          user={targetUserForModal}
          open={sanctionModalOpen}
          onOpenChange={setSanctionModalOpen}
          initialStatus={sanctionInitialStatus}
        />
      )}

      {/* Point Adjustment Modal Adapter */}
      {targetUserForModal && isAdmin && (
        <PointAdjustmentModal
          user={{
            id: targetUserForModal.id,
            display_name: targetUserForModal.display_name,
            contributor_tier: (author?.contributor_tier as any) || 0,
            contribution_points: author?.contribution_points || 0,
          }}
          open={pointModalOpen}
          onOpenChange={setPointModalOpen}
        />
      )}

      {/* Global Report Modal */}
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={contentId}
        targetType={contentType}
        targetTitle={deleteLabel}
      />
    </>
  );
}
