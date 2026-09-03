"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Search, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppUser {
  id: string;
  clerk_id: string;
  display_name: string;
  email: string;
  profile_image_url: string;
  role: "STUDENT" | "SENIOR_STUDENT" | "TEACHER" | "ADMIN" | null;
  ban_status: "ACTIVE" | "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN";
  ban_expires_at: string | null;
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["adminUsers", debouncedSearch],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
      return apiFetch<any>(`/users/${qs}`, token);
    },
  });

  const users: AppUser[] = Array.isArray(data) ? data : (data?.data || data?.results || []);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/users/${id}/role/`, token, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  const updateBanMutation = useMutation({
    mutationFn: async ({ id, ban_status }: { id: string; ban_status: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/users/${id}/ban/`, token, {
        method: "PATCH",
        body: JSON.stringify({ ban_status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Users Management" description="Manage roles and ban statuses." />
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setDebouncedSearch(search);
            }}
            onBlur={() => setDebouncedSearch(search)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted border-b border-line text-ink-muted">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Ban Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {u.profile_image_url ? (
                          <img src={u.profile_image_url} alt="" className="size-8 rounded-full object-cover" />
                        ) : (
                          <div className="size-8 rounded-full bg-line flex items-center justify-center">
                            <UserCheck className="size-4 text-ink-muted" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{u.display_name}</div>
                          <div className="text-xs text-ink-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        className="rounded border border-line bg-surface px-2 py-1 text-sm focus:outline-none"
                        value={u.role || ""}
                        onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                        disabled={updateRoleMutation.isPending}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="SENIOR_STUDENT">SENIOR_STUDENT</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <Badge variant={u.ban_status === "ACTIVE" ? "default" : "destructive"}>
                        {u.ban_status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <select
                        className="rounded border border-line bg-surface px-2 py-1 text-sm focus:outline-none text-danger"
                        value={u.ban_status}
                        onChange={(e) => updateBanMutation.mutate({ id: u.id, ban_status: e.target.value })}
                        disabled={updateBanMutation.isPending}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="WARNING">WARNING</option>
                        <option value="BANNED_24H">BANNED_24H</option>
                        <option value="BANNED_7D">BANNED_7D</option>
                        <option value="PERMANENT_BAN">PERMANENT_BAN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

