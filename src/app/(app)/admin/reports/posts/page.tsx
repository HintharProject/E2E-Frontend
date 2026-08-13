import Link from "next/link";
import { Badge, Button, PageHeader, SubNav } from "@/components/ui";
import {
  formatDate,
  getPost,
  getUser,
  reports,
} from "@/lib/mock-data";

export default async function AdminPostReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "PENDING" } = await searchParams;
  const items = reports.filter(
    (r) =>
      r.targetType === "POST" &&
      r.status === (status.toUpperCase() as typeof r.status),
  );

  return (
    <div>
      <PageHeader
        title="Moderation — Posts"
        description="Pending reports resolve to Resolved or Dismissed. Admins can delete posts."
      />
      <SubNav
        items={[
          { href: "/admin/reports/posts", label: "Posts", active: true },
          { href: "/admin/reports/lessons", label: "Lessons" },
          { href: "/admin/reports/profiles", label: "Profiles" },
          { href: "/admin/audit-logs", label: "Audit logs" },
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["PENDING", "RESOLVED", "DISMISSED"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/reports/posts?status=${s}`}
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
          const post = getPost(r.targetId);
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
                {post ? (
                  <Link
                    href={`/posts/${post.id}`}
                    className="hover:text-brand-dark"
                  >
                    {post.title}
                  </Link>
                ) : (
                  r.targetId
                )}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{r.reason}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary">Resolve</Button>
                <Button variant="ghost">Dismiss</Button>
                <Button variant="danger">Delete post</Button>
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
