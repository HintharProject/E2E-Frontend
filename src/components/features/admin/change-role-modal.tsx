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
import { RoleEnum } from "@/types/user";
import { Shield, ShieldAlert, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChangeRoleModalProps {
  user: {
    id: string;
    display_name: string;
    email?: string;
    role: RoleEnum | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isActorSuperAdmin: boolean;
  onSuccess?: () => void;
}

const AVAILABLE_ROLES: {
  role: RoleEnum;
  label: string;
  description: string;
  superAdminOnly?: boolean;
}[] = [
  {
    role: "USER",
    label: "User (Standard Member)",
    description: "Standard learning access: view lessons, ask questions, post solutions, and participate in discussions.",
  },
  {
    role: "MODERATOR",
    label: "Moderator",
    description: "Community moderation privileges: review reported content, hide spam posts, and issue moderation warnings.",
  },
  {
    role: "ADMIN",
    label: "Admin",
    description: "Platform management privileges: manage taxonomies, publish curriculum, and configure resources.",
    superAdminOnly: true,
  },
];

export function ChangeRoleModal({
  user,
  open,
  onOpenChange,
  isActorSuperAdmin,
  onSuccess,
}: ChangeRoleModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<RoleEnum>("USER");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (user?.role && user.role !== "SUPERADMIN") {
      setSelectedRole(user.role);
    } else {
      setSelectedRole("USER");
    }
    setReason("");
  }, [user, open]);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user selected");
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      return apiFetch(`/users/${user.id}/role/`, token, {
        method: "PATCH",
        body: JSON.stringify({
          role: selectedRole,
          reason: reason.trim() || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast.success(`Role updated successfully to ${selectedRole} for ${user?.display_name}`);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.data?.error?.message || err?.message || "Failed to update user role.";
      toast.error(msg);
    },
  });

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === user.role) {
      toast.info(`User already holds role ${selectedRole}.`);
      onOpenChange(false);
      return;
    }
    updateRoleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="size-5 text-primary" />
              Change Staff Role
            </DialogTitle>
            <DialogDescription>
              Assign platform role and governance permissions to this user.
            </DialogDescription>
          </DialogHeader>

          {/* User Preview */}
          <div className="rounded-xl border border-line bg-muted/30 p-3 text-xs">
            <div className="font-semibold text-ink">{user.display_name}</div>
            {user.email ? <div className="text-ink-muted">{user.email}</div> : null}
            <div className="mt-1 text-ink-muted">
              Current Role: <span className="font-semibold text-ink">{user.role || "USER"}</span>
            </div>
          </div>

          {/* Role Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink">Select New Role</label>
            <div className="grid gap-2">
              {AVAILABLE_ROLES.map((r) => {
                const isSelected = selectedRole === r.role;
                const isDisabled = r.superAdminOnly && !isActorSuperAdmin;

                return (
                  <button
                    key={r.role}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedRole(r.role)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-ink ring-1 ring-primary/20"
                        : "border-line bg-card hover:bg-muted/40 text-ink-muted",
                      isDisabled && "cursor-not-allowed opacity-40 hover:bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-line bg-surface"
                      )}
                    >
                      {isSelected && <Check className="size-2.5" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        {r.label}
                        {isDisabled && (
                          <span className="text-[10px] text-amber-500 font-normal">
                            (SuperAdmin only)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-ink-muted">
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Audit Reason (Optional)</label>
            <Input
              placeholder="e.g. Promoted to Subject Moderator following review..."
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
              disabled={updateRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateRoleMutation.isPending || selectedRole === user.role}
              className="gap-1.5"
            >
              {updateRoleMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Save Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
