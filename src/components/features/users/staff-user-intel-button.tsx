"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isModeratorOrAbove } from "@/types/user";
import { StaffUserIntelDrawer } from "@/components/features/users/staff-user-intel-drawer";
import { cn } from "@/lib/utils";
import type { UserPublic } from "@/types";
import type { RoleEnum, BanState } from "@/types/user";
import type { ContributorTier } from "@/types/contribution";

export interface StaffUserIntelButtonProps {
  userId: string;
  profile:
    | UserPublic
    | {
        id: string;
        display_name: string;
        email?: string;
        role?: RoleEnum | string | null;
        ban_status?: BanState | string | null;
        ban_expires_at?: string | null;
        contributor_tier?: ContributorTier | number | null;
        contribution_points?: number;
      };
  variant?: "default" | "compact" | "icon";
  className?: string;
  onActionSuccess?: () => void;
}

export function StaffUserIntelButton({
  userId,
  profile,
  variant = "default",
  className,
  onActionSuccess,
}: StaffUserIntelButtonProps) {
  const { user: currentUser } = useCurrentUser();
  const [open, setOpen] = useState(false);

  // Strictly visible only to staff (Moderators, Admins, SuperAdmins)
  if (!currentUser || !isModeratorOrAbove(currentUser.role)) {
    return null;
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "size-7 border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400",
            className
          )}
          onClick={() => setOpen(true)}
          title="Staff Intel"
          aria-label="Open Staff Intel"
        >
          <Shield className="size-3.5 text-amber-500" />
        </Button>
      ) : variant === "compact" ? (
        <Button
          variant="outline"
          size="xs"
          className={cn(
            "h-7 px-2 text-[11px] font-semibold border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 gap-1",
            className
          )}
          onClick={() => setOpen(true)}
          aria-label="Open Staff Intel"
        >
          <Shield className="size-3 text-amber-500" />
          <span>Intel</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-2.5 text-xs font-semibold border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 gap-1.5",
            className
          )}
          onClick={() => setOpen(true)}
          id="staff-intel-trigger"
          aria-label="Open Staff Intel"
        >
          <Shield className="size-3.5 text-amber-500" />
          <span>Staff Intel</span>
        </Button>
      )}

      <StaffUserIntelDrawer
        userId={userId}
        profile={profile}
        open={open}
        onOpenChange={setOpen}
        onActionSuccess={onActionSuccess}
      />
    </>
  );
}
