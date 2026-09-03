"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  admin_details: { display_name: string };
  action: string;
  target_identifier: string;
  reason: string;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const { getToken } = useAuth();

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["adminAuditLogs"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/audit-logs/", token);
      return Array.isArray(res) ? res : (res?.data || res?.results || []);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit logs"
        description="Immutable record of bans and hard deletions."
      />
      <SubNav
        items={[
          { href: "/admin/reports/posts", label: "Posts" },
          { href: "/admin/reports/lessons", label: "Lessons" },
          { href: "/admin/reports/profiles", label: "Profiles" },
          { href: "/admin/audit-logs", label: "Audit logs", active: true },
        ]}
      />

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted border-b border-line text-ink-muted">
                <tr>
                  <th className="p-4 font-semibold">When</th>
                  <th className="p-4 font-semibold">Admin</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Target / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-ink-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">
                      {log.admin_details?.display_name || "System"}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{log.action}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs text-ink-muted">{log.target_identifier}</div>
                      {log.reason && <div className="mt-1 text-sm">{log.reason}</div>}
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
