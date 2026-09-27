"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isModeratorOrAbove, isAdminOrSuperAdmin, Role, BanState, RoleEnum } from "@/types/user";
import type { ContributorTier } from "@/types/contribution";
import { useStaffActions, TakedownTargetType, TakedownAction } from "@/hooks/use-staff-actions";
import { ManageSanctionModal, SanctionTargetUser } from "@/components/features/admin/manage-sanction-modal";
import { PointAdjustmentModal } from "@/components/features/admin/point-adjustment-modal";
import { StaffUserIntelDrawer } from "@/components/features/users/staff-user-intel-drawer";
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
import {
  ShieldAlert,
  EyeOff,
  Eye,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  Coins,
  FileMinus,
  FileCheck,
  User,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaffAuthorInfo {
  id?: string;
  display_name?: string;
  email?: string;
  role?: Role;
  contributor_tier?: number;
  contribution_points?: number;
  ban_status?: BanState;
  ban_expires_at?: string | null;
}

export interface StaffContentActionMenuProps {
  targetType: TakedownTargetType;
  targetId: string;
  targetTitle?: string;
  author?: StaffAuthorInfo | null;
  isHidden?: boolean;
  isLocked?: boolean;
  isDeleted?: boolean;
  /** For problems: whether problem has reached final consensus */
  isFinal?: boolean;
  /** Custom trigger or button label */
  trigger?: React.ReactNode;
  /** Visual variant: standard icon button or styled badge */
  variant?: "icon" | "badge" | "button";
  className?: string;
  onSuccess?: (action?: TakedownAction) => void;
}

interface PendingActionConfig {
  action: TakedownAction;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  requiresReason?: boolean;
}

export function StaffContentActionMenu({
  targetType,
  targetId,
  targetTitle,
  author,
  isHidden = false,
  isLocked = false,
  isDeleted = false,
  isFinal = false,
  trigger,
  variant = "icon",
  className,
  onSuccess,
}: StaffContentActionMenuProps) {
  const { user: currentUser } = useCurrentUser();
  const { takedownMutation, isPending } = useStaffActions();

  // Role Gate: strictly render null if not moderator or above
  if (!isModeratorOrAbove(currentUser?.role)) {
    return null;
  }

  const isAdmin = isAdminOrSuperAdmin(currentUser?.role);

  // Modal & Dialog states
  const [confirmConfig, setConfirmConfig] = useState<PendingActionConfig | null>(null);
  const [actionReason, setActionReason] = useState("");

  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);
  const [initialSanctionStatus, setInitialSanctionStatus] = useState<BanState>("WARNING");
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);

  // Author normalization for modals
  const targetUserForModal: SanctionTargetUser | null = author?.id
    ? {
        id: author.id,
        display_name: author.display_name || "Author",
        email: author.email,
        ban_status: author.ban_status || "ACTIVE",
        ban_expires_at: author.ban_expires_at || null,
      }
    : null;

  const handleTriggerAction = (config: PendingActionConfig) => {
    setActionReason("");
    setConfirmConfig(config);
  };

  const handleExecuteAction = async () => {
    if (!confirmConfig) return;

    const actionExecuted = confirmConfig.action;
    await takedownMutation.mutateAsync({
      target_id: targetId,
      target_type: targetType,
      action: actionExecuted,
      reason: actionReason.trim() || `Staff action triggered by ${currentUser?.display_name}`,
    });

    setConfirmConfig(null);
    onSuccess?.(actionExecuted);
  };

  const handleOpenWarning = () => {
    setInitialSanctionStatus("WARNING");
    setSanctionModalOpen(true);
  };

  const handleOpenSanction = () => {
    setInitialSanctionStatus("BANNED_24H");
    setSanctionModalOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            trigger ? (
              (trigger as any)
            ) : variant === "badge" ? (
              <Button
                variant="outline"
                size="xs"
                className={cn(
                  "h-6 px-2 gap-1 text-[11px] font-semibold border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20",
                  className
                )}
                title="Staff Moderation Actions"
              >
                <ShieldAlert className="size-3 text-amber-500" />
                <span>Mod</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300",
                  className
                )}
                title="Staff Moderation Controls"
              >
                <ShieldAlert className="size-4" />
              </Button>
            )
          }
        />
        <DropdownMenuContent align="end" className="w-56 text-xs">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            <Shield className="size-3.5" />
            <span>Staff Moderation</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* 1. Content Visibility & Status Toggles */}
          {targetType !== "LESSON" && (
            <>
              {isHidden ? (
                <DropdownMenuItem
                  onClick={() =>
                    handleTriggerAction({
                      action: "unhide",
                      title: `Unhide ${targetType}`,
                      description: `Make this ${targetType.toLowerCase()} publicly visible to all students again.`,
                      confirmLabel: "Unhide Item",
                    })
                  }
                  className="gap-2 text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  <Eye className="size-3.5" />
                  <span>Unhide {targetType}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    handleTriggerAction({
                      action: "hide",
                      title: `Hide ${targetType}`,
                      description: `Hide this ${targetType.toLowerCase()} from public student feeds immediately. Only staff will see it.`,
                      confirmLabel: "Hide from Students",
                      isDestructive: true,
                    })
                  }
                  className="gap-2 text-amber-600 dark:text-amber-400"
                >
                  <EyeOff className="size-3.5" />
                  <span>Hide {targetType}</span>
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Lesson Delist vs Restore */}
          {targetType === "LESSON" && (
            (isDeleted || isHidden) ? (
              <DropdownMenuItem
                onClick={() =>
                  handleTriggerAction({
                    action: "restore",
                    title: "Restore Lesson to Published",
                    description: "Re-publish this lesson so it is visible to students again.",
                    confirmLabel: "Restore Lesson",
                  })
                }
                className="gap-2 text-emerald-600 dark:text-emerald-400 font-medium"
              >
                <Eye className="size-3.5" />
                <span>Restore to Published</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() =>
                  handleTriggerAction({
                    action: "delist",
                    title: "Delist Lesson to Draft",
                    description: "Unpublish this lesson and demote it back to Draft status so students cannot view it.",
                    confirmLabel: "Delist to Draft",
                    isDestructive: true,
                  })
                }
                className="gap-2 text-amber-600 dark:text-amber-400"
              >
                <FileMinus className="size-3.5" />
                <span>Delist to Draft</span>
              </DropdownMenuItem>
            )
          )}

          {/* Post or Problem Locking */}
          {(targetType === "POST" || targetType === "PROBLEM") && (
            <>
              {isLocked ? (
                <DropdownMenuItem
                  onClick={() =>
                    handleTriggerAction({
                      action: "unlock",
                      title: `Unlock Discussion`,
                      description: `Re-open comments and replies for this ${targetType.toLowerCase()}.`,
                      confirmLabel: "Unlock Thread",
                    })
                  }
                  className="gap-2 text-emerald-600 dark:text-emerald-400"
                >
                  <Unlock className="size-3.5" />
                  <span>Unlock Thread</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    handleTriggerAction({
                      action: "lock",
                      title: `Lock Discussion`,
                      description: `Prevent students from submitting new comments, replies, or solutions to this ${targetType.toLowerCase()}.`,
                      confirmLabel: "Lock Thread",
                      isDestructive: true,
                    })
                  }
                  className="gap-2 text-muted-foreground"
                >
                  <Lock className="size-3.5" />
                  <span>Lock Discussion</span>
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Soft Deletion */}
          {!isDeleted && (
            <DropdownMenuItem
              onClick={() =>
                handleTriggerAction({
                  action: "soft_delete",
                  title: isFinal ? "Staff Override Delete" : `Soft Delete ${targetType}`,
                  description: isFinal
                    ? "This problem has finalized consensus. As a staff member, your deletion overrides finality and automatically reconciles author milestone points."
                    : `Soft delete this ${targetType.toLowerCase()} and archive associated media/replies.`,
                  confirmLabel: "Confirm Deletion",
                  isDestructive: true,
                  requiresReason: true,
                })
              }
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span>{isFinal ? "Staff Override Delete" : `Delete ${targetType}`}</span>
            </DropdownMenuItem>
          )}

          {/* 2. Disciplinary & Author Sanctions */}
          {targetUserForModal && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
                Author: {author?.display_name || "Offender"}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={handleOpenWarning} className="gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                <span>Issue Warning</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleOpenSanction} className="gap-2 text-destructive focus:text-destructive">
                <ShieldAlert className="size-3.5" />
                <span>Sanction / Suspend</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setIntelOpen(true)} className="gap-2 text-amber-600 dark:text-amber-400">
                <Shield className="size-3.5 text-amber-500" />
                <span>Staff Intel</span>
              </DropdownMenuItem>

              {/* Point Adjustment for Solutions or Posts (Admins Only) */}
              {isAdmin && targetUserForModal.id && (
                <DropdownMenuItem onClick={() => setPointModalOpen(true)} className="gap-2 text-primary">
                  <Coins className="size-3.5" />
                  <span>Adjust Points</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem nativeButton={false} render={<Link href={`/users/${targetUserForModal.id}`} className="gap-2" />}>
                <User className="size-3.5" />
                <span>View Author Profile</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog for Takedown Actions */}
      <Dialog open={!!confirmConfig} onOpenChange={(open) => !open && setConfirmConfig(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert
                className={cn("size-5", confirmConfig?.isDestructive ? "text-destructive" : "text-amber-500")}
              />
              {confirmConfig?.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-ink-muted">
              {confirmConfig?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-line bg-muted/40 p-3 text-xs space-y-1">
              <div className="font-semibold text-ink">{targetTitle || `${targetType} (${targetId.slice(0, 8)}...)`}</div>
              {author?.display_name && (
                <div className="text-ink-muted">Author: {author.display_name}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Audit Reason {confirmConfig?.requiresReason ? "(Mandatory)" : "(Optional)"}
              </label>
              <Input
                placeholder="e.g., Unsolicited commercial spam link in step 2"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmConfig(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant={confirmConfig?.isDestructive ? "destructive" : "default"}
              size="sm"
              onClick={handleExecuteAction}
              disabled={isPending || (confirmConfig?.requiresReason && !actionReason.trim())}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>{confirmConfig?.confirmLabel}</span>
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
          initialStatus={initialSanctionStatus}
        />
      )}

      {/* Point Adjustment Modal Adapter (Admins Only) */}
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

      {/* Staff Intel Drawer */}
      {targetUserForModal && (
        <StaffUserIntelDrawer
          userId={targetUserForModal.id}
          profile={{
            id: targetUserForModal.id,
            display_name: targetUserForModal.display_name,
            email: targetUserForModal.email,
            ban_status: targetUserForModal.ban_status,
            ban_expires_at: targetUserForModal.ban_expires_at,
            role: (author?.role as RoleEnum) || "USER",
            contributor_tier: (author?.contributor_tier as ContributorTier) ?? 1,
            contribution_points: author?.contribution_points || 0,
          }}
          open={intelOpen}
          onOpenChange={setIntelOpen}
          onActionSuccess={onSuccess}
        />
      )}
    </>
  );
}
