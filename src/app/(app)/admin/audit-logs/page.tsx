import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { auditLogs, formatDate, getUser } from "@/lib/mock-data";

export default function AdminAuditLogsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => {
              const admin = getUser(log.adminId);
              return (
                <tr key={log.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {admin?.displayName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {log.target}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
