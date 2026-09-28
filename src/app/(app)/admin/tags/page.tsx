"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isModeratorOrAbove } from "@/types/user";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";
import { TagsMergeStudioSection } from "@/components/features/admin/taxonomy/tags-merge-studio-section";

export default function AdminTagsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminTagsContent />
    </Suspense>
  );
}

function AdminTagsContent() {
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
        title="Tag Merge Studio"
        description="Search, manage, and consolidate duplicate forum and lesson tags across the learning catalog."
      />
      <TagsMergeStudioSection />
    </div>
  );
}
