"use client";

import { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { HorizontalFilterBar } from "@/components/layout/horizontal-filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { parseFilterList } from "@/lib/filter-params";
import { getFileExtension } from "@/lib/resources";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";
import {
  PastPapersFolderView,
  type PairedPapersContext,
} from "@/components/features/resources/past-papers-folder-view";
import {
  DocumentViewerModal,
  type ViewingDocument,
} from "@/components/features/resources/document-viewer-modal";
import { AskInSolveModal } from "@/components/features/train/ask-in-solve-modal";
import { SaveButton } from "@/components/features/collections/save-button";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Lightbulb,
  Search,
  X,
} from "lucide-react";

function ResourcesLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading resources">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

function ResourcesFeed() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));
  const isSelectForProblem = searchParams.get("selectForProblem") === "true";
  const initialTab =
    !isSelectForProblem && searchParams.get("tab") === "textbooks"
      ? "TEXTBOOKS"
      : "PAST_PAPERS";

  const [activeTab, setActiveTab] = useState<"PAST_PAPERS" | "TEXTBOOKS">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingDoc, setViewingDoc] = useState<ViewingDocument | null>(null);
  const [askModalState, setAskModalState] = useState<{
    paper: Resource;
    paired?: PairedPapersContext;
  } | null>(null);

  const { data: resources = [], isLoading, isError, refetch } = useQuery<Resource[]>({
    queryKey: ["userResourcesList", levels.join(","), subjects.join(",")],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (levels.length > 0) params.append("level", levels.join(","));
      if (subjects.length > 0) params.append("subject", subjects.join(","));
      params.append("page_size", "100");

      const res = await apiFetch<{ data?: Resource[]; results?: Resource[] } | Resource[]>(
        `/resources/files/?${params.toString()}`,
        token as string
      );
      return Array.isArray(res) ? res : res?.data || res?.results || [];
    },
  });

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter((r) => {
      const haystacks = [
        r.title,
        r.file_name,
        r.paper_code,
        r.session,
        r.year ? String(r.year) : "",
        r.subject_details?.name,
        r.subject_details?.code,
        r.level_details?.name,
      ];
      return haystacks.some((val) => val && val.toLowerCase().includes(q));
    });
  }, [resources, searchQuery]);

  const pastPapers = useMemo(
    () => filteredResources.filter((r) => r.resource_type === "PAST_PAPER"),
    [filteredResources]
  );

  const textbooks = useMemo(
    () => filteredResources.filter((r) => r.resource_type === "TEXTBOOK"),
    [filteredResources]
  );

  const backToProblemHref = useMemo(() => {
    const params = new URLSearchParams({ origin: "PAST_PAPER" });
    if (levels[0]) params.set("level", levels[0]);
    if (subjects[0]) params.set("subject", subjects[0]);
    return `/problems/new?${params.toString()}`;
  }, [levels, subjects]);

  const handleOpenAskInSolve = (paper: Resource, paired?: PairedPapersContext) => {
    setAskModalState({ paper, paired });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Contextual Banner when selecting a curated Past Paper for Solve! Path B */}
      {isSelectForProblem && (
        <div
          role="region"
          aria-label="Solve! paper selection mode"
          className="rounded-xl border border-primary/35 bg-primary/8 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary/15 text-primary shrink-0">
              <Lightbulb className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Selecting a Curated Past Paper for Solve!
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Preview any paper below and click &ldquo;Select for Problem&rdquo; to check existing solutions or ask the community.
              </p>
            </div>
          </div>

          <Link
            href={backToProblemHref}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1.5 font-semibold shrink-0",
            })}
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Back to Problem Form</span>
          </Link>
        </div>
      )}

      {/* Horizontal Filter Bar + Quick Paper Code / Filename Search */}
      <HorizontalFilterBar
        hideTags
        showSort={false}
        rightActions={
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              sizeVariant="sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Paper code or filename..."
              aria-label="Search papers and textbooks by code or filename"
              className="pl-8 pr-8 h-9 sm:h-8.5 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear resource search"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <ResourcesLoadingSkeleton />
      ) : isError ? (
        <EmptyState
          title="Failed to load resources"
          description="We ran into an issue retrieving the archive. Please try again."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      ) : (
        <>
          {/* Segmented Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div
              role="tablist"
              aria-label="Resource categories"
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "PAST_PAPERS"}
                onClick={() => setActiveTab("PAST_PAPERS")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 sm:py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeTab === "PAST_PAPERS"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <Calendar className="size-3.5 text-primary" aria-hidden="true" />
                <span>Past Papers</span>
                <span
                  className={cn(
                    "font-mono tabular-nums text-xs px-2 py-0.5 rounded-full font-semibold",
                    activeTab === "PAST_PAPERS"
                      ? "bg-primary/12 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {pastPapers.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "TEXTBOOKS"}
                onClick={() => setActiveTab("TEXTBOOKS")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 sm:py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeTab === "TEXTBOOKS"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <BookOpen className="size-3.5 text-primary" aria-hidden="true" />
                <span>Textbooks &amp; Guides</span>
                <span
                  className={cn(
                    "font-mono tabular-nums text-xs px-2 py-0.5 rounded-full font-semibold",
                    activeTab === "TEXTBOOKS"
                      ? "bg-primary/12 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {textbooks.length}
                </span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-mono tabular-nums hidden sm:block">
              {levels.length > 0 || subjects.length > 0 || searchQuery.trim()
                ? `${filteredResources.length} matching resources`
                : `${resources.length} archived resources`}
            </p>
          </div>

          {/* Main Content Area */}
          {activeTab === "PAST_PAPERS" ? (
            <PastPapersFolderView
              papers={pastPapers}
              variant="browse"
              onView={setViewingDoc}
              onAskInSolve={handleOpenAskInSolve}
              selectForProblemMode={isSelectForProblem}
              emptyMessage={
                searchQuery.trim()
                  ? `No past papers match "${searchQuery.trim()}". Try clearing the search or adjusting Level/Subject filters.`
                  : "No past papers have been uploaded for this selection yet."
              }
            />
          ) : textbooks.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No textbooks or guides available"
              description={
                searchQuery.trim()
                  ? `No textbooks match "${searchQuery.trim()}". Try a different keyword or clear filters.`
                  : "Textbooks and study guides for this subject or level have not been uploaded yet."
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {textbooks.map((tb) => {
                const ext = getFileExtension(tb.file_name || "");
                const title = tb.title || tb.file_name || "Study Resource";

                return (
                  <Card
                    key={tb.id}
                    className="flex flex-col justify-between gap-4 p-5 group"
                  >
                    <CardHeader className="flex-row items-start gap-3.5 space-y-0">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
                        <DocTypeIcon
                          filename={tb.file_name || ""}
                          resourceType={tb.resource_type}
                          className="size-5 shrink-0"
                        />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1 gap-2">
                        <CardTitle
                          className="text-sm font-semibold leading-snug line-clamp-2"
                          title={tb.file_name || title}
                        >
                          {title}
                        </CardTitle>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {tb.level_details?.name && (
                            <Badge variant="secondary">
                              {tb.level_details.name}
                            </Badge>
                          )}
                          {tb.subject_details?.name && (
                            <Badge variant="outline">
                              {tb.subject_details.name}
                            </Badge>
                          )}
                          {ext && (
                            <span className="font-mono text-xs uppercase font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {ext.replace(".", "")}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardFooter className="justify-between gap-2 pt-3">
                      <SaveButton
                        entityType="resource"
                        entityId={tb.id}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                        showLabel
                        label="Save"
                      />

                      <div className="flex items-center gap-1.5">
                        {tb.file_url && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                            onClick={() =>
                              setViewingDoc({
                                paper: tb,
                                title: tb.file_name || title,
                                url: tb.file_url!,
                                downloadUrl: tb.download_url,
                              })
                            }
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                            <span>View</span>
                          </Button>
                        )}

                        <a
                          href={tb.download_url || tb.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download={tb.file_name || title}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "sm",
                            className:
                              "h-8 px-2.5 gap-1.5 text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors",
                          })}
                          aria-label={`Download ${title}`}
                        >
                          <Download className="size-3.5" aria-hidden="true" />
                          <span>Download</span>
                        </a>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* In-App Document Preview Modal */}
      <DocumentViewerModal
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />

      {/* Solve! Community Bridge Modal */}
      {askModalState && (
        <AskInSolveModal
          isOpen={Boolean(askModalState)}
          onClose={() => setAskModalState(null)}
          activePaper={askModalState.paper}
          leftPaper={askModalState.paired?.qp || askModalState.paper}
          rightPaper={askModalState.paired?.ms || null}
          openInSameTab={isSelectForProblem}
        />
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<ResourcesLoadingSkeleton />}>
        <ResourcesFeed />
      </Suspense>
    </div>
  );
}
