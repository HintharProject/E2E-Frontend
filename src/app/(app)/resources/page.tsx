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
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Download,
  BookOpen,
  Calendar,
  Eye,
  ExternalLink,
  X,
} from "lucide-react";
import { parseFilterList } from "@/lib/filter-params";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { YEARS as ALL_YEARS, getFileExtension } from "@/lib/resources";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";

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
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string; downloadUrl?: string } | null>(null);

  // Expanded Year folders (default expand recent years e.g. 2026, 2025, 2024, 2023)
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({
    2026: true,
    2025: true,
    2024: true,
    2023: true,
  });

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

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

  // Group Past Papers by Year
  const papersByYear = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (const y of ALL_YEARS) {
      map[y] = [];
    }
    for (const p of pastPapers) {
      if (p.year && map[p.year]) {
        map[p.year].push(p);
      } else if (p.year) {
        map[p.year] = [p];
      }
    }
    return map;
  }, [pastPapers]);

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

  const formatSession = (s?: string) => {
    if (s === "MAY_JUNE") return "May / June";
    if (s === "OCT_NOV") return "Oct / Nov";
    if (s === "JANUARY") return "January";
    return s || "";
  };

  const isPdf = (title: string, url: string) => {
    const ext = getFileExtension(title) || getFileExtension(url.split('?')[0]);
    return ext === ".pdf" || !ext;
  };

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
        <div className="flex flex-col gap-3">
          {ALL_YEARS.map((y) => {
            const papers = papersByYear[y] || [];
            const isExpanded = !!expandedYears[y];

            return (
              <div
                key={y}
                className="rounded-2xl border border-line bg-card overflow-hidden transition-all shadow-2xs"
              >
                {/* Year Folder Header */}
                <button
                  type="button"
                  onClick={() => toggleYear(y)}
                  className="flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors w-full focus:outline-none select-none"
                >
                  <div className="flex items-center justify-center size-8 rounded-lg bg-surface border border-line text-primary">
                    {isExpanded ? (
                      <FolderOpen className="size-4" />
                    ) : (
                      <Folder className="size-4" />
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-ink text-base">{y}</span>
                    <span className="text-xs text-ink-muted">Past Papers</span>
                  </div>

                  <div className="ml-auto flex items-center gap-2.5">
                    <Badge variant={papers.length > 0 ? "secondary" : "outline"} className="text-xs">
                      {papers.length} {papers.length === 1 ? "doc" : "docs"}
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-ink-muted" />
                    ) : (
                      <ChevronRight className="size-4 text-ink-muted" />
                    )}
                  </div>
                </button>

                {/* Inside Year Documents */}
                {isExpanded && (
                  <div className="border-t border-line bg-surface/30 p-3 flex flex-col gap-2">
                    {papers.length === 0 ? (
                      <p className="text-xs text-ink-muted text-center py-4 italic">
                        No past papers uploaded for {y} yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-line border border-line rounded-xl bg-card overflow-hidden">
                        {papers.map((paper: any) => {
                          const ext = getFileExtension(paper.file_name);
                          return (
                            <div
                              key={paper.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-muted/40 transition-colors group"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="mt-0.5 flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
                                  <DocTypeIcon filename={paper.file_name} resourceType={paper.resource_type} />
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-ink text-sm truncate" title={paper.file_name}>
                                    {paper.file_name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {paper.session && (
                                      <span className="inline-flex items-center text-[11px] font-medium text-ink-muted bg-surface border border-line px-2 py-0.5 rounded-md">
                                        {formatSession(paper.session)}
                                      </span>
                                    )}
                                    {paper.paper_type && (
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] uppercase font-semibold ${
                                          paper.paper_type === "QP"
                                            ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                                            : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                                        }`}
                                      >
                                        {paper.paper_type === "QP" ? "Question Paper" : "Mark Scheme"}
                                      </Badge>
                                    )}
                                    {ext && (
                                      <span className="text-[10px] uppercase font-semibold text-ink-muted bg-muted px-1.5 py-0.5 rounded">
                                        {ext.replace(".", "")}
                                      </span>
                                    )}
                                    {paper.subject_details?.name && (
                                      <span className="text-[11px] text-ink-muted">
                                        {paper.subject_details.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 shrink-0 sm:self-center">
                                {/* View In-App Modal */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                                  onClick={() =>
                                    setViewingDoc({
                                      title: paper.file_name,
                                      url: paper.file_url,
                                      downloadUrl: paper.download_url,
                                    })
                                  }
                                >
                                  <Eye className="size-3.5" />
                                  <span>View</span>
                                </Button>

                                {/* Download Link */}
                                <a
                                  href={paper.download_url || paper.file_url}
                                  download={paper.file_name}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={buttonVariants({
                                    variant: "secondary",
                                    size: "sm",
                                    className: "h-8 px-2.5 gap-1.5 text-xs font-semibold shadow-2xs hover:bg-primary hover:text-primary-foreground transition-colors",
                                  })}
                                >
                                  <Download className="size-3.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-card border border-line rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-surface">
              <div className="flex items-center gap-2.5 min-w-0">
                <DocTypeIcon filename={viewingDoc.title} />
                <span className="font-semibold text-sm text-ink truncate">
                  {viewingDoc.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewingDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "h-8 px-2.5 gap-1.5 text-xs font-medium",
                  })}
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open in Tab</span>
                </a>
                <a
                  href={viewingDoc.downloadUrl || viewingDoc.url}
                  download={viewingDoc.title}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                    className: "h-8 px-2.5 gap-1.5 text-xs font-medium",
                  })}
                >
                  <Download className="size-3.5" />
                  <span>Download</span>
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-ink-muted hover:text-ink"
                  onClick={() => setViewingDoc(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Viewer Body: PDF Iframe or Document Card */}
            {isPdf(viewingDoc.title, viewingDoc.url) ? (
              <div className="flex-1 w-full bg-muted/20">
                <iframe
                  src={`${viewingDoc.url}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-none"
                  title={viewingDoc.title}
                />
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col items-center justify-center p-8 bg-muted/10 text-center gap-4">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <DocTypeIcon filename={viewingDoc.title} className="size-8" />
                </div>
                <div className="max-w-md flex flex-col gap-1">
                  <h4 className="font-semibold text-ink text-base">{viewingDoc.title}</h4>
                  <p className="text-xs text-ink-muted">
                    This document format ({getFileExtension(viewingDoc.title).toUpperCase()}) can be downloaded directly or opened in an external viewer.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={viewingDoc.downloadUrl || viewingDoc.url}
                    download={viewingDoc.title}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                      className: "gap-2",
                    })}
                  >
                    <Download className="size-4" />
                    <span>Download File</span>
                  </a>
                  <a
                    href={viewingDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "gap-2",
                    })}
                  >
                    <ExternalLink className="size-4" />
                    <span>Open Directly</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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

