import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";

export default function AdminLessonReportsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Moderation — Lessons"
        description="Pending reports resolve to Resolved or Dismissed. Admins can delete lessons."
      />
      <SubNav
        items={[
          { href: "/admin/reports/posts", label: "Posts" },
          { href: "/admin/reports/lessons", label: "Lessons", active: true },
          { href: "/admin/reports/profiles", label: "Profiles" },
          { href: "/admin/audit-logs", label: "Audit logs" },
        ]}
      />
      <p className="text-sm text-ink-muted">No lesson reports yet.</p>
    </div>
  );
}
