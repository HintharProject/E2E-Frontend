"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isModeratorOrAbove } from "@/types/user";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";
import { UnclassifiedTriageSection } from "@/components/features/admin/taxonomy/unclassified-triage-section";

export default function AdminTriagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminTriageContent />
    </Suspense>
  );
}

function AdminTriageContent() {
  const { user: currentUser, isLoading } = useCurrentUser();
  const router = useRouter();

  const isStaff = !isLoading && !!currentUser && isModeratorOrAbove(currentUser.role);

  useEffect(() => {
    if (!isLoading && (!currentUser || !isModeratorOrAbove(currentUser.role))) {
      router.replace("/admin/reports");
    }
  }, [isLoading, currentUser, router]);

  if (isLoading || !isStaff) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Unclassified Content Triage"
        description="Inspect and reclassify content items that fell back to undefined subject/level or unassigned exam timelines."
      />
      <UnclassifiedTriageSection />
    </div>
  );
}
