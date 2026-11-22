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
            "min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] md:size-7 border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
            className
          )}
          onClick={() => setOpen(true)}
          title="Staff Intel"
          aria-label="Open Staff Intel"
        >
          <Shield className="size-3.5 text-warning" aria-hidden="true" />
        </Button>
      ) : variant === "compact" ? (
        <Button
          variant="outline"
          size="xs"
          className={cn(
            "min-h-[36px] md:min-h-[28px] h-7 px-2 text-[11px] font-semibold border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 gap-1",
            className
          )}
          onClick={() => setOpen(true)}
          aria-label="Open Staff Intel"
        >
          <Shield className="size-3 text-warning" aria-hidden="true" />
          <span>Intel</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-2.5 text-xs font-semibold border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 gap-1.5",
            className
          )}
          onClick={() => setOpen(true)}
          id="staff-intel-trigger"
          aria-label="Open Staff Intel"
        >
          <Shield className="size-3.5 text-warning" aria-hidden="true" />
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
