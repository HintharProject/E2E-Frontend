import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";

export default async function AdminPostReportsPage(props: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams?.status || "PENDING";
  
  // TODO: Fetch reports from API in Phase 6/7
  const items: any[] = [];

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
        {/*
        {items.map((r) => {
          return null;
        })}
        */}
        {items.length === 0 ? (
          <li className="text-sm text-ink-muted">No reports in this state.</li>
        ) : null}
      </ul>
    </div>
  );
}
