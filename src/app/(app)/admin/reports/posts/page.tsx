import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import {
  formatDate,
  getPost,
  getUser,
  reports,
} from "@/lib/mock-data";

export default async function AdminPostReportsPage(props: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams?.status || "PENDING";
  const items = reports.filter(
    (r) =>
      r.targetType === "POST" &&
      r.status === (status.toUpperCase() as typeof r.status),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${
              status.toUpperCase() === s
                ? "bg-brand text-white border-transparent"
                : "bg-card text-ink-muted border-line hover:border-brand/40"
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
              className="rounded-2xl border border-line bg-card p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-warning/20 text-warning">{r.status}</Badge>
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
                <Button variant="destructive">Delete post</Button>
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
