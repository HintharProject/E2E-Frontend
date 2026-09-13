"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { Loader2, Trash2, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminPostReportsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ["adminReports", "POST"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/reports/queue/?target_type=POST", token);
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
      queryClient.invalidateQueries({ queryKey: ["adminReports", "POST"] });
    },
  });

  const takedown = useMutation({
    mutationFn: async ({ target_id, action }: { target_id: string; action: string }) => {
      const token = await getToken();
      return apiFetch(`/takedown/`, token as string, {
        method: "POST",
        body: JSON.stringify({ target_id, target_type: "POST", action }),
      });
    },
    onSuccess: () => {
      // Typically resolve reports associated with this post as well
      queryClient.invalidateQueries({ queryKey: ["adminReports", "POST"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Moderation — Posts"
        description="Pending reports for posts."
      />
      <SubNav
        items={[
          { href: "/admin/reports/posts", label: "Posts", active: true },
          { href: "/admin/reports/lessons", label: "Lessons" },
          { href: "/admin/reports/profiles", label: "Profiles" },
          { href: "/admin/audit-logs", label: "Audit logs" },
        ]}
      />

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">No pending reports for posts.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted border-b border-line text-ink-muted">
                <tr>
                  <th className="p-4 font-semibold">Post</th>
                  <th className="p-4 font-semibold">Reason</th>
                  <th className="p-4 font-semibold">Reporter</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 max-w-[200px] truncate">
                      <a href={`/forum/${r.reported_post}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        View Post {r.reported_post.substring(0, 8)}...
                      </a>
                    </td>
                    <td className="p-4">{r.reason}</td>
                    <td className="p-4">{r.reporter_details?.display_name || "Unknown"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "DISMISSED" })} disabled={updateStatus.isPending}>
                          Dismiss
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => takedown.mutate({ target_id: r.reported_post, action: "soft_delete" })} disabled={takedown.isPending}>
                          <Trash2 className="size-4 mr-1" /> Takedown
                        </Button>
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
