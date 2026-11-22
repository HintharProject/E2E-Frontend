"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  isModeratorOrAbove,
  isAdminOrSuperAdmin,
  isSuperAdmin,
  Role,
  BanState,
  RoleEnum,
} from "@/types/user";
import type { ContributorTier } from "@/types/contribution";
import { ManageSanctionModal, SanctionTargetUser } from "@/components/features/admin/manage-sanction-modal";
import { ChangeRoleModal } from "@/components/features/admin/change-role-modal";
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
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Shield,
  Coins,
  Flag,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaffUserTarget {
  id: string;
  display_name?: string | null;
  email?: string | null;
  role?: Role | string;
  ban_status?: BanState;
  ban_expires_at?: string | null;
  contributor_tier?: number;
  contribution_points?: number;
  profile_image_url?: string | null;
}

export interface StaffUserQuickActionsProps {
  user: StaffUserTarget;
  variant?: "dock" | "dropdown";
  className?: string;
  onSuccess?: () => void;
}

export function useStaffUserQuickActions(targetUser?: StaffUserTarget | null, onSuccess?: () => void) {
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);
  const [initialSanctionStatus, setInitialSanctionStatus] = useState<BanState>("WARNING");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [intelDrawerOpen, setIntelDrawerOpen] = useState(false);

  const isStaff = isModeratorOrAbove(currentUser?.role);
  const isAdmin = isAdminOrSuperAdmin(currentUser?.role);
  const isSelf = Boolean(currentUser?.id && targetUser?.id && currentUser.id === targetUser.id);

  const handleActionSuccess = () => {
    if (targetUser?.id) {
      queryClient.invalidateQueries({ queryKey: ["user", targetUser.id] });
      queryClient.invalidateQueries({ queryKey: ["contribution-stats", targetUser.id] });
    }
    queryClient.invalidateQueries({ queryKey: ["users"] });
    onSuccess?.();
  };

  const openWarning = () => {
    setInitialSanctionStatus("WARNING");
    setSanctionModalOpen(true);
  };

  const openSanction = () => {
    setInitialSanctionStatus("BANNED_24H");
    setSanctionModalOpen(true);
  };

  const openRoleModal = () => setRoleModalOpen(true);
  const openPointModal = () => setPointModalOpen(true);
  const openIntelDrawer = () => setIntelDrawerOpen(true);

  return {
    isStaff,
    isAdmin,
    isSelf,
    canModerate: isStaff && !isSelf,
    canManageRole: isAdmin && !isSelf,
    canAdjustPoints: isAdmin && !isSelf,
    sanctionModalOpen,
    setSanctionModalOpen,
    initialSanctionStatus,
    roleModalOpen,
    setRoleModalOpen,
    pointModalOpen,
    setPointModalOpen,
    intelDrawerOpen,
    setIntelDrawerOpen,
    handleActionSuccess,
    openWarning,
    openSanction,
    openRoleModal,
    openPointModal,
    openIntelDrawer,
  };
}

export function StaffUserQuickActions({
  user,
  variant = "dock",
  className,
  onSuccess,
}: StaffUserQuickActionsProps) {
  const {
    canModerate,
    isAdmin,
    sanctionModalOpen,
    setSanctionModalOpen,
    initialSanctionStatus,
    roleModalOpen,
    setRoleModalOpen,
    pointModalOpen,
    setPointModalOpen,
    intelDrawerOpen,
    setIntelDrawerOpen,
    handleActionSuccess,
    openWarning,
    openSanction,
    openRoleModal,
    openPointModal,
  } = useStaffUserQuickActions(user, onSuccess);

  if (!canModerate) {
    return null;
  }

  const { user: currentUser } = useCurrentUser();
  const targetForSanction: SanctionTargetUser = {
    id: user.id,
    display_name: user.display_name || "User",
    email: user.email || undefined,
    ban_status: user.ban_status || "ACTIVE",
    ban_expires_at: user.ban_expires_at || null,
  };

  const targetForRole = {
    id: user.id,
    display_name: user.display_name || "User",
    email: user.email || "",
    role: (user.role as Role) || "USER",
  };

  const targetForPoints = {
    id: user.id,
    display_name: user.display_name || "User",
    contributor_tier: (user.contributor_tier as ContributorTier) ?? 0,
    contribution_points: user.contribution_points || 0,
  };

  return (
    <>
      {variant === "dock" ? (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 hover:bg-destructive/10 text-destructive text-xs"
            onClick={openSanction}
          >
            <ShieldAlert className="size-3.5 mr-1" />
            Sanction
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={openRoleModal}
              >
                <Shield className="size-3.5 mr-1 text-primary" />
                Role
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={openPointModal}
              >
                <Coins className="size-3.5 mr-1 text-warning" aria-hidden="true" />
                Points
              </Button>
            </>
          )}

          {/* Staff Intel Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            className="border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 text-xs font-semibold gap-1.5"
            onClick={() => setIntelDrawerOpen(true)}
            id="staff-intel-dock-trigger"
          >
            <Shield className="size-3.5 text-warning" aria-hidden="true" />
            <span>Staff Intel</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            nativeButton={false}
            render={<Link href="/admin/reports" />}
          >
            <Flag className="size-3.5 mr-1" aria-hidden="true" />
            Reports
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="xs"
                className={cn(
                  "min-h-[36px] md:min-h-[28px] h-7 px-2 gap-1 text-[11px] font-semibold border-warning/40 text-warning bg-warning/10 hover:bg-warning/20",
                  className
                )}
              >
                <ShieldAlert className="size-3 text-warning" aria-hidden="true" />
                <span>Mod</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52 text-xs">
            <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-warning uppercase tracking-wider">
              <Shield className="size-3.5" aria-hidden="true" />
              <span>Staff Actions</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={openWarning} className="gap-2 text-warning">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              <span>Issue Warning</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={openSanction} className="gap-2 text-destructive focus:text-destructive">
              <ShieldAlert className="size-3.5" aria-hidden="true" />
              <span>Sanction / Suspend</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setIntelDrawerOpen(true)} className="gap-2 text-warning">
              <Shield className="size-3.5 text-warning" aria-hidden="true" />
              <span>Staff Intel</span>
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openRoleModal} className="gap-2 text-primary">
                  <UserCheck className="size-3.5" />
                  <span>Change Role</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={openPointModal} className="gap-2 text-primary">
                  <Coins className="size-3.5" />
                  <span>Adjust Points</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sanction Modal */}
      <ManageSanctionModal
        user={targetForSanction}
        open={sanctionModalOpen}
        onOpenChange={setSanctionModalOpen}
        initialStatus={initialSanctionStatus}
        onSuccess={handleActionSuccess}
      />

      {/* Role Modal */}
      {isAdmin && (
        <ChangeRoleModal
          user={targetForRole}
          open={roleModalOpen}
          onOpenChange={setRoleModalOpen}
          isActorSuperAdmin={isSuperAdmin(currentUser?.role)}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* Point Modal */}
      {isAdmin && (
        <PointAdjustmentModal
          user={targetForPoints}
          open={pointModalOpen}
          onOpenChange={setPointModalOpen}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* Staff Intel Drawer */}
      <StaffUserIntelDrawer
        userId={user.id}
        profile={{
          id: user.id,
          display_name: user.display_name || "User",
          email: user.email || "",
          ban_status: user.ban_status,
          ban_expires_at: user.ban_expires_at,
          role: (user.role as RoleEnum) || "USER",
          contributor_tier: (user.contributor_tier as ContributorTier) ?? 1,
          contribution_points: user.contribution_points || 0,
        }}
        open={intelDrawerOpen}
        onOpenChange={setIntelDrawerOpen}
        onActionSuccess={handleActionSuccess}
      />
    </>
  );
}
