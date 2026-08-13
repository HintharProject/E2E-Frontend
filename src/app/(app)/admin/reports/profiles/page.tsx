import Link from "next/link";
import { Badge, Button, PageHeader, SubNav } from "@/components/ui";
import {
  formatDate,
  getUser,
  reports,
} from "@/lib/mock-data";

export default async function AdminProfileReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "PENDING" } = await searchParams;
  const items = reports.filter(
    (r) =>
      r.targetType === "USER" &&
      r.status === (status.toUpperCase() as typeof r.status),
  );

  return (
    <div>
      <PageHeader
        title="Moderation — Profiles"
        description="Issue bans from here or open the user profile."
      />
      <SubNav
        items={[
          { href: "/admin/reports/posts", label: "Posts" },
          { href: "/admin/reports/lessons", label: "Lessons" },
          { href: "/admin/reports/profiles", label: "Profiles", active: true },
          { href: "/admin/audit-logs", label: "Audit logs" },
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["PENDING", "RESOLVED", "DISMISSED"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/reports/profiles?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status.toUpperCase() === s
                ? "bg-brand text-white"
                : "bg-white text-ink-muted border border-line"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>
      <ul className="space-y-3">
        {items.map((r) => {
          const target = getUser(r.targetId);
          const reporter = getUser(r.reporterId);
          return (
            <li
              key={r.id}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warn">{r.status}</Badge>
                <span className="text-xs text-ink-muted">
                  {formatDate(r.createdAt)} · by {reporter?.displayName}
                </span>
              </div>
              <p className="mt-2 font-semibold text-ink">
                {target ? (
                  <Link
                    href={`/users/${target.id}`}
                    className="hover:text-brand-dark"
                  >
                    {target.displayName}
                  </Link>
                ) : (
                  r.targetId
                )}{" "}
                <Badge tone="muted">{target?.banState}</Badge>
              </p>
              <p className="mt-1 text-sm text-ink-muted">{r.reason}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary">Resolve</Button>
                <Button variant="ghost">Dismiss</Button>
                <Button variant="secondary">Warning</Button>
                <Button variant="secondary">Ban 24h</Button>
                <Button variant="secondary">Ban 7d</Button>
                <Button variant="danger">Permanent ban</Button>
              </div>
            </li>
          );
        })}
        {items.length === 0 ? (
          <li className="text-sm text-ink-muted">No reports in this state.</li>
        ) : null}
      </ul>
    </div>
  );
}
