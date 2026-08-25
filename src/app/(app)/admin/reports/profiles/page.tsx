import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";

export default function AdminProfileReportsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Moderation — Profiles"
        description="Pending reports resolve to Resolved or Dismissed. Admins can ban users."
      />
      <SubNav
        items={[
          { href: "/admin/reports/posts", label: "Posts" },
          { href: "/admin/reports/lessons", label: "Lessons" },
          { href: "/admin/reports/profiles", label: "Profiles", active: true },
          { href: "/admin/audit-logs", label: "Audit logs" },
        ]}
      />
      <p className="text-sm text-ink-muted">No profile reports yet.</p>
    </div>
  );
}
