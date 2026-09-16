"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminProfileReportsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ["adminReports", "USER"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/reports/queue/?target_type=USER", token);
      return Array.isArray(res) ? res : (res?.data || res?.results || []);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      return apiFetch(`/reports/${id}/status/`, token as string, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports", "USER"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Moderation — Profiles"
        description="Pending reports for user profiles."
      />
      <SubNav
        items={[
          { href: "/admin/reports/posts", label: "Posts" },
          { href: "/admin/reports/lessons", label: "Lessons" },
          { href: "/admin/reports/profiles", label: "Profiles", active: true },
          { href: "/admin/audit-logs", label: "Audit logs" },
        ]}
      />

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">No pending reports for profiles.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted border-b border-line text-ink-muted">
                <tr>
                  <th className="p-4 font-semibold">Reported User ID</th>
                  <th className="p-4 font-semibold">Reason</th>
                  <th className="p-4 font-semibold">Reporter</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/admin/users?search=${r.reported_user}`} className="text-primary hover:underline">
                        {r.reported_user.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="p-4">{r.reason}</td>
                    <td className="p-4">{r.reporter_details?.display_name || "Unknown"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "DISMISSED" })} disabled={updateStatus.isPending}>
                          Dismiss
                        </Button>
                        <Link href={`/admin/users?search=${r.reported_user}`} className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                          <ShieldAlert className="size-4 mr-1" /> Manage User
                        </Link>
                      </div>
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
