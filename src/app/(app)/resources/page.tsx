"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Loader2, 
  Download,
  BookOpen,
  Calendar,
  Eye,
} from "lucide-react";
import { parseFilterList } from "@/lib/filter-params";
import { Button, buttonVariants } from "@/components/ui/button";
import { getFileExtension } from "@/lib/resources";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";
import { PastPapersFolderView } from "@/components/features/resources/past-papers-folder-view";
import {
  DocumentViewerModal,
  ViewingDocument,
} from "@/components/features/resources/document-viewer-modal";

function ResourcesFeed() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));

  const subjectId = subjects.length > 0 ? subjects[0] : "";
  const levelId = levels.length > 0 ? levels[0] : "";

  // Active section tab: 'PAST_PAPERS' or 'TEXTBOOKS'
  const [activeTab, setActiveTab] = useState<"PAST_PAPERS" | "TEXTBOOKS">("PAST_PAPERS");

  // In-app Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<ViewingDocument | null>(null);

  // Fetch Resources List
  const { data: resources = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["userResourcesList", levels.join(","), subjects.join(",")],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (levels.length > 0) params.append("level", levels.join(","));
      if (subjects.length > 0) params.append("subject", subjects.join(","));

      const res = await apiFetch<any>(`/resources/files/?${params.toString()}`, token as string);
      return Array.isArray(res) ? res : res?.data || res?.results || [];
    },
  });

  // Split into Past Papers and Textbooks
  const pastPapers = useMemo(() => {
    return resources.filter((r: any) => r.resource_type === "PAST_PAPER");
  }, [resources]);

  const textbooks = useMemo(() => {
    return resources.filter((r: any) => r.resource_type === "TEXTBOOK");
  }, [resources]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load resources"
        description="We ran into an issue retrieving resources. Please try again."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("PAST_PAPERS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "PAST_PAPERS"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-line text-ink-muted hover:text-ink hover:bg-muted"
            }`}
          >
            <Calendar className="size-4" />
            <span>Past Papers</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "PAST_PAPERS"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-ink-muted"
              }`}
            >
              {pastPapers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TEXTBOOKS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "TEXTBOOKS"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-line text-ink-muted hover:text-ink hover:bg-muted"
            }`}
          >
            <BookOpen className="size-4" />
            <span>Textbooks & Resources</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "TEXTBOOKS"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-ink-muted"
              }`}
            >
              {textbooks.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-ink-muted hidden sm:block">
          {levelId || subjectId ? "Filtered results" : "Showing all resources"}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "PAST_PAPERS" ? (
        <PastPapersFolderView
          papers={pastPapers}
          variant="browse"
          onView={setViewingDoc}
          emptyMessage="No past papers uploaded yet."
        />
      ) : (
        /* Textbooks View */
        <div className="flex flex-col gap-4">
          {textbooks.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card p-12 text-center text-ink-muted">
              <BookOpen className="size-10 mx-auto text-ink-muted/40 mb-3" />
              <p className="font-semibold text-ink text-base">No Textbooks Available</p>
              <p className="text-xs text-ink-muted mt-1">
                Textbooks for this subject or level have not been uploaded yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {textbooks.map((tb: any) => {
                const ext = getFileExtension(tb.file_name);
                return (
                  <div
                    key={tb.id}
                    className="rounded-2xl border border-line bg-card p-5 flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors shadow-2xs group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                        <DocTypeIcon filename={tb.file_name} resourceType={tb.resource_type} className="size-5 shrink-0" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-semibold text-ink text-sm line-clamp-2 leading-snug">
                          {tb.file_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-muted">
                          {tb.level_details?.name && (
                            <span className="bg-surface border border-line px-2 py-0.5 rounded">
                              {tb.level_details.name}
                            </span>
                          )}
                          {tb.subject_details?.name && (
                            <span className="bg-surface border border-line px-2 py-0.5 rounded">
                              {tb.subject_details.name}
                            </span>
                          )}
                          {ext && (
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
                              {ext.replace(".", "")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                      <span className="text-[11px] text-ink-muted uppercase">
                        {ext ? `${ext.replace(".", "")} Document` : "Document"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                          onClick={() =>
                            setViewingDoc({
                              title: tb.file_name,
                              url: tb.file_url,
                              downloadUrl: tb.download_url,
                            })
                          }
                        >
                          <Eye className="size-3.5" />
                          <span>View</span>
                        </Button>
                        <a
                          href={tb.download_url || tb.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download={tb.file_name}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "sm",
                            className: "h-8 px-2.5 gap-1.5 text-xs font-semibold shadow-2xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors",
                          })}
                        >
                          <Download className="size-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* In-App Document Viewer Modal */}
      <DocumentViewerModal
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-3 sm:px-6">
      <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar hideTags />
        </Suspense>
        <div className="min-w-0 flex-1 lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:custom-scrollbar lg:pr-2">
          <Suspense
            fallback={
              <div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>
            }
          >
            <ResourcesFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

