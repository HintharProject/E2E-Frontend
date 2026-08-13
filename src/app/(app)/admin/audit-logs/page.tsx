import { Badge, PageHeader, SubNav } from "@/components/ui";
import { auditLogs, formatDate, getUser } from "@/lib/mock-data";

export default function AdminAuditLogsPage() {
  return (
    <div>
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
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
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
                  <td className="px-4 py-3 font-semibold">
                    {admin?.displayName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="brand">{log.action}</Badge>
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
