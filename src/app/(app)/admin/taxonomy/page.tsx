"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isAdminOrSuperAdmin } from "@/types/user";
import { PageHeader } from "@/components/ui/page-header";
import {
  Loader2,
  Calendar,
  GraduationCap,
  Tag as TagIcon,
  ShieldAlert,
  Layers3,
} from "lucide-react";
import { TagsMergeStudioSection } from "@/components/features/admin/taxonomy/tags-merge-studio-section";
import { AcademicStructureSection } from "@/components/features/admin/taxonomy/academic-structure-section";
import { ExamPeriodsSection } from "@/components/features/admin/taxonomy/exam-periods-section";
import { ModerationReasonsSection } from "@/components/features/admin/taxonomy/moderation-reasons-section";
import { UnclassifiedTriageSection } from "@/components/features/admin/taxonomy/unclassified-triage-section";

type ActiveTab = "tags" | "academic" | "exams" | "moderation" | "unclassified";

export default function AdminTaxonomyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminTaxonomyContent />
    </Suspense>
  );
}

function AdminTaxonomyContent() {
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ActiveTab | null;

  const isAdmin = !isUserLoading && !!currentUser && isAdminOrSuperAdmin(currentUser.role);

  const initialTab: ActiveTab =
    tabParam && ["tags", "academic", "exams", "moderation", "unclassified"].includes(tabParam)
      ? tabParam
      : "academic";

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  useEffect(() => {
    if (tabParam && ["tags", "academic", "exams", "moderation", "unclassified"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!isUserLoading && (!currentUser || !isAdminOrSuperAdmin(currentUser.role))) {
      router.replace("/admin/reports");
    }
  }, [isUserLoading, currentUser, router]);

  if (isUserLoading || !isAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Taxonomy & Operations Studio"
        description="Comprehensive management of academic hierarchy, tag consolidation, exam timelines, and moderation rules."
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("academic")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "academic"
              ? "bg-card text-ink shadow-sm border border-line font-semibold"
              : "text-ink-muted hover:text-ink hover:bg-card/50"
          }`}
        >
          <GraduationCap className="size-3.5 text-blue-500" />
          Academic Structure (Subjects & Levels)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("exams")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "exams"
              ? "bg-card text-ink shadow-sm border border-line font-semibold"
              : "text-ink-muted hover:text-ink hover:bg-card/50"
          }`}
        >
          <Calendar className="size-3.5 text-emerald-500" />
          Exam Periods & Sessions
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("moderation")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "moderation"
              ? "bg-card text-ink shadow-sm border border-line font-semibold"
              : "text-ink-muted hover:text-ink hover:bg-card/50"
          }`}
        >
          <ShieldAlert className="size-3.5 text-amber-500" />
          Violation Reasons Taxonomy
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tags")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "tags"
              ? "bg-card text-ink shadow-sm border border-line font-semibold"
              : "text-ink-muted hover:text-ink hover:bg-card/50"
          }`}
        >
          <TagIcon className="size-3.5 text-primary" />
          Tags & Merge Studio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unclassified")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "unclassified"
              ? "bg-card text-ink shadow-sm border border-line font-semibold"
              : "text-ink-muted hover:text-ink hover:bg-card/50"
          }`}
        >
          <Layers3 className="size-3.5 text-purple-500" />
          Unclassified Content Triage
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "academic" && <AcademicStructureSection />}
      {activeTab === "exams" && <ExamPeriodsSection />}
      {activeTab === "moderation" && <ModerationReasonsSection />}
      {activeTab === "tags" && <TagsMergeStudioSection />}
      {activeTab === "unclassified" && <UnclassifiedTriageSection />}
    </div>
  );
}
