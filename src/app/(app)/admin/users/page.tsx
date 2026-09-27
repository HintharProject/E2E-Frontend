"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isSuperAdmin, isAdminOrSuperAdmin, RoleEnum, BanState } from "@/types/user";
import { ContributorTier } from "@/types/contribution";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { BanCountdownBadge } from "@/components/features/admin/ban-countdown-badge";
import { ChangeRoleModal } from "@/components/features/admin/change-role-modal";
import { ManageSanctionModal } from "@/components/features/admin/manage-sanction-modal";
import { PointAdjustmentModal } from "@/components/features/admin/point-adjustment-modal";
import {
  Loader2,
  Search,
  UserCheck,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Award,
  ExternalLink,
  ChevronDown,
  Lock,
} from "lucide-react";

export interface AdminUserItem {
  id: string;
  clerk_id: string;
  display_name: string;
  email: string;
  profile_image_url: string;
  role: RoleEnum | null;
  ban_status: BanState;
  ban_expires_at: string | null;
  is_ban_expired?: boolean;
  ban_seconds_remaining?: number;
  contribution_points?: number;
  contributor_tier?: ContributorTier;
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const router = useRouter();

  const isAuthorized = !isUserLoading && !!currentUser && isAdminOrSuperAdmin(currentUser.role);

  useEffect(() => {
    if (!isUserLoading && (!currentUser || !isAdminOrSuperAdmin(currentUser.role))) {
      router.replace("/admin/reports");
    }
  }, [isUserLoading, currentUser, router]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal States
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);

  const isActorSuperAdmin = isSuperAdmin(currentUser?.role);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["adminUsers", debouncedSearch],
    enabled: isAuthorized,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
      return apiFetch<any>(`/users/${qs}`, token);
    },
  });

  if (isUserLoading || !isAuthorized) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const users: AdminUserItem[] = Array.isArray(data) ? data : (data?.data || data?.results || []);

  const handleOpenRoleModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleOpenSanctionModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setSanctionModalOpen(true);
  };

  const handleOpenPointsModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setPointsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Users Management"
          description="Manage user governance, staff roles, disciplinary sanctions, and contribution reputation."
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setDebouncedSearch(search);
            }}
            onBlur={() => setDebouncedSearch(search)}
          />
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">
            <UserCheck className="mx-auto size-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No users found.</p>
            <p className="text-xs text-ink-muted mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted/70 border-b border-line text-ink-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Ban Status</th>
                  <th className="p-4 font-semibold">Contribution</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => {
                  const isTargetSuperAdmin = u.role === "SUPERADMIN";
                  const isTargetAdmin = u.role === "ADMIN";

                  // Permissions logic:
                  // 1. SuperAdmins are completely immutable
                  // 2. Admins cannot modify other Admins
                  // 3. SuperAdmin can modify Admin, Moderator, User
                  const canManageRole = !isTargetSuperAdmin && (isActorSuperAdmin || !isTargetAdmin);
                  const canManageBan = !isTargetSuperAdmin && (isActorSuperAdmin || !isTargetAdmin);

                  return (
                    <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                      {/* User Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.profile_image_url ? (
                            <img
                              src={u.profile_image_url}
                              alt=""
                              className="size-9 rounded-full object-cover border border-line"
                            />
                          ) : (
                            <div className="size-9 rounded-full bg-muted flex items-center justify-center border border-line">
                              <UserCheck className="size-4 text-ink-muted" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <div className="font-medium text-ink flex items-center gap-2">
                              {u.display_name}
                              {u.contributor_tier !== undefined && (
                                <ContributorBadge tier={u.contributor_tier} size="sm" showIcon={false} />
                              )}
                            </div>
                            <div className="text-xs text-ink-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="p-4">
                        {u.role === "SUPERADMIN" ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold gap-1 text-xs"
                          >
                            <Lock className="size-3 text-amber-500" />
                            SuperAdmin (System)
                          </Badge>
                        ) : u.role === "ADMIN" ? (
                          <Badge
                            variant="outline"
                            className="border-primary/40 bg-primary/10 text-primary font-medium text-xs gap-1"
                          >
                            <Shield className="size-3" />
                            Admin
                          </Badge>
                        ) : u.role === "MODERATOR" ? (
                          <Badge
                            variant="outline"
                            className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs gap-1"
                          >
                            <ShieldAlert className="size-3" />
                            Moderator
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-line text-ink-muted font-normal text-xs">
                            User
                          </Badge>
                        )}
                      </td>

                      {/* Ban Status Column */}
                      <td className="p-4">
                        <BanCountdownBadge
                          banStatus={u.ban_status}
                          banExpiresAt={u.ban_expires_at}
                          onExpire={() => queryClient.invalidateQueries({ queryKey: ["adminUsers"] })}
                        />
                      </td>

                      {/* Contribution Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-semibold text-ink">
                            {u.contribution_points ?? 0}
                          </span>
                          <span className="text-ink-muted text-[11px]">pts</span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="p-4 text-right">
                        {isTargetSuperAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="gap-1.5 opacity-50 cursor-not-allowed text-xs text-ink-muted"
                            title="System SuperAdmin accounts are immutable"
                          >
                            Action <Lock className="size-3.5 text-amber-500/70" />
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs font-medium cursor-pointer"
                                >
                                  Action <ChevronDown className="size-3.5 text-ink-muted" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-52">
                              {/* 1. Change Role */}
                              <DropdownMenuItem
                                onClick={() => handleOpenRoleModal(u)}
                                disabled={!canManageRole}
                                className="cursor-pointer"
                              >
                                <Shield className="size-3.5 mr-2 text-primary" />
                                Change Role
                              </DropdownMenuItem>

                              {/* 2. Manage Sanction */}
                              <DropdownMenuItem
                                onClick={() => handleOpenSanctionModal(u)}
                                disabled={!canManageBan}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <AlertTriangle className="size-3.5 mr-2 text-destructive" />
                                Manage Sanction
                              </DropdownMenuItem>

                              {/* 3. Adjust Points */}
                              <DropdownMenuItem
                                onClick={() => handleOpenPointsModal(u)}
                                className="cursor-pointer"
                              >
                                <Award className="size-3.5 mr-2 text-amber-500" />
                                Adjust Points
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* 4. View Profile */}
                              <DropdownMenuItem className="cursor-pointer p-0">
                                <Link
                                  href={`/users/${u.id}`}
                                  target="_blank"
                                  className="flex items-center gap-2 w-full px-2 py-1 text-xs"
                                >
                                  <ExternalLink className="size-3.5 mr-2 text-ink-muted" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <ChangeRoleModal
        user={selectedUser}
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        isActorSuperAdmin={isActorSuperAdmin}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["adminUsers"] })}
      />

      {/* Sanction Management Modal */}
      <ManageSanctionModal
        user={selectedUser}
        open={sanctionModalOpen}
        onOpenChange={setSanctionModalOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["adminUsers"] })}
      />

      {/* Contribution Points Modal */}
      {selectedUser && (
        <PointAdjustmentModal
          user={{
            id: selectedUser.id,
            display_name: selectedUser.display_name,
            contributor_tier: selectedUser.contributor_tier,
            contribution_points: selectedUser.contribution_points,
          }}
          open={pointsModalOpen}
          onOpenChange={setPointsModalOpen}
        />
      )}
    </div>
  );
}
