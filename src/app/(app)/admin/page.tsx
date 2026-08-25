import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, moderation queue, and site settings."
      />
      <EmptyState
        title="No reports to review"
        description="The moderation queue is currently empty."
      />
    </div>
  );
}
