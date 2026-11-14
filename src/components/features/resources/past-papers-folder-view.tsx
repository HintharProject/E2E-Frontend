"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Resource } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";
import { ViewingDocument } from "@/components/features/resources/document-viewer-modal";
import { getFileExtension, formatYear } from "@/lib/resources";
import { useExamTaxonomy } from "@/hooks/use-exam-taxonomy";
import { SaveButton } from "@/components/features/collections/save-button";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  MessageSquare,
} from "lucide-react";

const SESSION_ORDER = ["MAY_JUNE", "OCT_NOV", "JANUARY", "FEB_MARCH", "OTHERS"] as const;

export function formatSession(s?: string): string {
  if (s === "MAY_JUNE") return "May / June";
  if (s === "OCT_NOV") return "Oct / Nov";
  if (s === "JANUARY") return "January";
  if (s === "FEB_MARCH") return "Feb / March";
  if (s === "OTHERS") return "Others";
  return s || "";
}

export interface PairedPapersContext {
  qp?: Resource;
  ms?: Resource;
}

export interface PastPapersFolderViewProps {
  papers: Resource[];
  variant?: "browse" | "select";
  selectedPaperId?: string;
  onSelectPaper?: (paper: Resource) => void;
  onView?: (doc: ViewingDocument) => void;
  onAskInSolve?: (paper: Resource, paired?: PairedPapersContext) => void;
  selectForProblemMode?: boolean;
  emptyMessage?: string;
  className?: string;
}

interface PaperGroup {
  key: string;
  paperCode: string | null;
  subjectName: string | null;
  levelName: string | null;
  qp?: Resource;
  ms?: Resource;
  items: Resource[];
}

interface SessionGroup {
  sessionKey: string;
  sessionLabel: string;
  groups: PaperGroup[];
  totalCount: number;
}

function groupSessionPapers(
  sessionPapers: Resource[],
  sessionsMap: Map<string, string>
): SessionGroup[] {
  const bySession = new Map<string, Resource[]>();

  for (const paper of sessionPapers) {
    const sess = paper.session || "OTHERS";
    const list = bySession.get(sess);
    if (list) {
      list.push(paper);
    } else {
      bySession.set(sess, [paper]);
    }
  }

  const orderedSessionKeys = Array.from(bySession.keys()).sort((a, b) => {
    const idxA = SESSION_ORDER.indexOf(a as (typeof SESSION_ORDER)[number]);
    const idxB = SESSION_ORDER.indexOf(b as (typeof SESSION_ORDER)[number]);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return orderedSessionKeys.map((sessionKey) => {
    const list = bySession.get(sessionKey) || [];
    const groupMap = new Map<string, PaperGroup>();

    for (const paper of list) {
      const normalizedCode = (paper.paper_code || "").trim().toLowerCase();
      const groupKey = normalizedCode
        ? `${paper.subject || ""}::${paper.level || ""}::${normalizedCode}`
        : `single::${paper.id}`;

      let group = groupMap.get(groupKey);
      if (!group) {
        group = {
          key: groupKey,
          paperCode: paper.paper_code?.trim() || null,
          subjectName: paper.subject_details?.name || null,
          levelName: paper.level_details?.name || null,
          items: [],
        };
        groupMap.set(groupKey, group);
      }

      group.items.push(paper);
      if (paper.paper_type === "QP" && !group.qp) {
        group.qp = paper;
      } else if (paper.paper_type === "MS" && !group.ms) {
        group.ms = paper;
      }
    }

    const groups = Array.from(groupMap.values()).sort((a, b) => {
      if (a.paperCode && b.paperCode) {
        return a.paperCode.localeCompare(b.paperCode, undefined, { numeric: true });
      }
      if (a.paperCode) return -1;
      if (b.paperCode) return 1;
      const nameA = a.items[0]?.title || a.items[0]?.file_name || "";
      const nameB = b.items[0]?.title || b.items[0]?.file_name || "";
      return nameA.localeCompare(nameB);
    });

    // Ensure QP appears before MS inside each group
    for (const g of groups) {
      g.items.sort((a, b) => {
        if (a.paper_type === "QP" && b.paper_type !== "QP") return -1;
        if (a.paper_type !== "QP" && b.paper_type === "QP") return 1;
        return (a.file_name || "").localeCompare(b.file_name || "");
      });
    }

    return {
      sessionKey,
      sessionLabel: sessionsMap.get(sessionKey) || formatSession(sessionKey) || "Other Session",
      groups,
      totalCount: list.length,
    };
  });
}

function PaperTypePill({ paperType }: { paperType?: string }) {
  if (!paperType) return null;
  const isQP = paperType === "QP";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-mono font-semibold uppercase tracking-wide shrink-0",
        isQP
          ? "border-primary/35 bg-primary/10 text-primary"
          : "border-border bg-secondary text-secondary-foreground"
      )}
    >
      {isQP ? "QP" : "MS"}
    </Badge>
  );
}

export function PastPapersFolderView({
  papers,
  variant = "browse",
  selectedPaperId,
  onSelectPaper,
  onView,
  onAskInSolve,
  selectForProblemMode = false,
  emptyMessage = "No past papers available.",
  className = "",
}: PastPapersFolderViewProps) {
  const { data: taxonomyData } = useExamTaxonomy();

  const sessionsMap = useMemo(() => {
    const map = new Map<string, string>();
    taxonomyData?.sessions?.forEach((s) => {
      map.set(s.code, s.name);
    });
    return map;
  }, [taxonomyData]);

  // Discover all years that actually contain papers, sorted descending with "others"/0 at the end
  const yearsWithPapers = useMemo(() => {
    const map = new Map<string | number, Resource[]>();
    for (const p of papers) {
      const yr = p.year !== undefined && p.year !== null && p.year !== "" ? p.year : "others";
      const existing = map.get(yr);
      if (existing) {
        existing.push(p);
      } else {
        map.set(yr, [p]);
      }
    }

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      const aLower = String(a).toLowerCase();
      const bLower = String(b).toLowerCase();
      if (aLower === "others" || a === 0) return 1;
      if (bLower === "others" || b === 0) return -1;
      return Number(b) - Number(a);
    });

    return sortedKeys.map((year) => ({
      year,
      papers: map.get(year) || [],
      sessions: groupSessionPapers(map.get(year) || [], sessionsMap),
    }));
  }, [papers, sessionsMap]);

  // Expand the top 3 most recent years by default
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (yearsWithPapers.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedYears((prev) => {
      const next = { ...prev };
      yearsWithPapers.forEach((entry, index) => {
        const key = String(entry.year);
        if (next[key] === undefined) {
          next[key] = index < 3 || yearsWithPapers.length <= 4;
        }
      });
      return next;
    });
  }, [yearsWithPapers]);

  const toggleYear = (year: string | number) => {
    const key = String(year);
    setExpandedYears((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (papers.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No matching past papers"
        description={emptyMessage}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      {yearsWithPapers.map(({ year, papers: yearPapers, sessions }) => {
        const yearKey = String(year);
        const isExpanded = !!expandedYears[yearKey];

        return (
          <section
            key={yearKey}
            aria-label={`${formatYear(year)} past papers`}
            className="rounded-xl border border-border bg-card overflow-hidden shadow-card transition-colors"
          >
            {/* Year Folder Header */}
            <button
              type="button"
              onClick={() => toggleYear(year)}
              aria-expanded={isExpanded}
              className="flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/45 transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-muted border border-border text-primary shrink-0">
                {isExpanded ? (
                  <FolderOpen className="size-4" aria-hidden="true" />
                ) : (
                  <Folder className="size-4" aria-hidden="true" />
                )}
              </div>

              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-heading font-semibold text-foreground text-base tabular-nums">
                  {formatYear(year)}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-2.5 shrink-0">
                <Badge variant="secondary" className="font-mono tabular-nums text-xs font-semibold">
                  {yearPapers.length} {yearPapers.length === 1 ? "file" : "files"}
                </Badge>
                {isExpanded ? (
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </button>

            {/* Sessions & Paired Paper Rows */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/20 p-3 sm:p-4 space-y-4">
                {sessions.map((session) => (
                  <div key={session.sessionKey} className="space-y-2">
                    {/* Session Sub-header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Calendar className="size-3.5 text-primary/80" aria-hidden="true" />
                        <span>{session.sessionLabel}</span>
                      </div>
                      <span className="font-mono tabular-nums text-xs text-muted-foreground">
                        {session.totalCount} {session.totalCount === 1 ? "paper" : "papers"}
                      </span>
                    </div>

                    {/* Paper Groups */}
                    <div className="space-y-2">
                      {session.groups.map((group) => {
                        const isPaired = group.items.length > 1 && Boolean(group.qp || group.ms);
                        const primaryPaper = group.qp || group.items[0];
                        const solveLabel = selectForProblemMode
                          ? "Select for Problem"
                          : "Ask in Solve!";

                        if (isPaired && variant === "browse") {
                          return (
                            <div
                              key={group.key}
                              className="rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-primary/35"
                            >
                              {/* Paired Group Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 bg-muted/35 border-b border-border/70">
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  {group.paperCode && (
                                    <Badge
                                      variant="outline"
                                      className="font-mono tabular-nums font-semibold text-xs border-border bg-card text-foreground"
                                    >
                                      Paper {group.paperCode}
                                    </Badge>
                                  )}
                                  {group.subjectName && (
                                    <span className="text-xs font-medium text-foreground truncate">
                                      {group.subjectName}
                                    </span>
                                  )}
                                  {group.levelName && (
                                    <Badge variant="secondary">
                                      {group.levelName}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground hidden md:inline">
                                    Paired QP + MS
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {onAskInSolve && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={selectForProblemMode ? "default" : "outline"}
                                      className={cn(
                                        "min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-semibold",
                                        !selectForProblemMode &&
                                          "border-border hover:border-primary/40 hover:text-primary"
                                      )}
                                      onClick={() =>
                                        onAskInSolve(primaryPaper, {
                                          qp: group.qp,
                                          ms: group.ms,
                                        })
                                      }
                                    >
                                      <MessageSquare className="size-3.5" aria-hidden="true" />
                                      <span>{solveLabel}</span>
                                    </Button>
                                  )}

                                  <Link
                                    href={`/train/${primaryPaper.id}`}
                                    className={buttonVariants({
                                      variant: selectForProblemMode ? "outline" : "default",
                                      size: "sm",
                                      className:
                                        "min-h-[36px] sm:min-h-0 h-8 px-3 gap-1 text-xs font-semibold",
                                    })}
                                    title="Practice Question Paper & Mark Scheme side by side in Train!"
                                  >
                                    <span>Train!</span>
                                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                                  </Link>
                                </div>
                              </div>

                              {/* Individual QP / MS Sub-rows */}
                              <div className="divide-y divide-border/70">
                                {group.items.map((paper) => {
                                  const ext = getFileExtension(paper.file_name || "");
                                  const title = paper.title || paper.file_name || "Past Paper";

                                  return (
                                    <div
                                      key={paper.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 hover:bg-muted/30 transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <PaperTypePill paperType={paper.paper_type} />
                                        <span
                                          className="text-xs sm:text-sm font-medium text-foreground truncate"
                                          title={paper.file_name || title}
                                        >
                                          {title}
                                        </span>
                                        {ext && (
                                          <span className="font-mono text-xs uppercase font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                            {ext.replace(".", "")}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                                        {onView && paper.file_url && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-medium"
                                            onClick={() =>
                                              onView({
                                                paper,
                                                title: paper.file_name || title,
                                                url: paper.file_url!,
                                                downloadUrl: paper.download_url,
                                              })
                                            }
                                          >
                                            <Eye className="size-3.5" aria-hidden="true" />
                                            <span>Preview</span>
                                          </Button>
                                        )}

                                        <SaveButton
                                          entityType="resource"
                                          entityId={paper.id}
                                          variant="ghost"
                                          size="sm"
                                          className="min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-medium"
                                          showLabel
                                          label="Save"
                                        />

                                        <a
                                          href={paper.download_url || paper.file_url}
                                          download={paper.file_name || title}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={buttonVariants({
                                            variant: "secondary",
                                            size: "sm",
                                            className:
                                              "min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-medium",
                                          })}
                                          aria-label={`Download ${title}`}
                                        >
                                          <Download className="size-3.5" aria-hidden="true" />
                                          <span>Download</span>
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // Single / Unpaired Rows (or `variant="select"` individual paper picking)
                        return (
                          <div
                            key={group.key}
                            className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden"
                          >
                            {group.items.map((paper) => {
                              const ext = getFileExtension(paper.file_name || "");
                              const isSelected = selectedPaperId === paper.id;
                              const title = paper.title || paper.file_name || "Past Paper";

                              return (
                                <div
                                  key={paper.id}
                                  className={cn(
                                    "flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-muted/35 transition-colors",
                                    isSelected && "bg-primary/5"
                                  )}
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div className="mt-0.5 flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
                                      <DocTypeIcon
                                        filename={paper.file_name || ""}
                                        resourceType={paper.resource_type}
                                      />
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                      <span
                                        className="font-medium text-foreground text-sm truncate"
                                        title={paper.file_name || title}
                                      >
                                        {title}
                                      </span>

                                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <PaperTypePill paperType={paper.paper_type} />
                                        {paper.paper_code && (
                                          <Badge
                                            variant="outline"
                                            className="font-mono tabular-nums text-xs font-semibold"
                                          >
                                            Paper {paper.paper_code}
                                          </Badge>
                                        )}
                                        {ext && (
                                          <span className="font-mono text-xs uppercase font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {ext.replace(".", "")}
                                          </span>
                                        )}
                                        {paper.subject_details?.name && (
                                          <span className="text-xs text-muted-foreground">
                                            {paper.subject_details.name}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 sm:self-center">
                                    {variant === "browse" ? (
                                      <>
                                        {onView && paper.file_url && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-medium"
                                            onClick={() =>
                                              onView({
                                                paper,
                                                title: paper.file_name || title,
                                                url: paper.file_url!,
                                                downloadUrl: paper.download_url,
                                              })
                                            }
                                          >
                                            <Eye className="size-3.5" aria-hidden="true" />
                                            <span>Preview</span>
                                          </Button>
                                        )}

                                        {onAskInSolve && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={selectForProblemMode ? "default" : "outline"}
                                            className="min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-semibold"
                                            onClick={() => onAskInSolve(paper)}
                                          >
                                            <MessageSquare className="size-3.5" aria-hidden="true" />
                                            <span>{solveLabel}</span>
                                          </Button>
                                        )}

                                        <SaveButton
                                          entityType="resource"
                                          entityId={paper.id}
                                          variant="ghost"
                                          size="sm"
                                          className="min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-medium"
                                          showLabel
                                          label="Save"
                                        />

                                        <a
                                          href={paper.download_url || paper.file_url}
                                          download={paper.file_name || title}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={buttonVariants({
                                            variant: "secondary",
                                            size: "sm",
                                            className:
                                              "min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-medium",
                                          })}
                                          aria-label={`Download ${title}`}
                                        >
                                          <Download className="size-3.5" aria-hidden="true" />
                                          <span className="hidden md:inline">Download</span>
                                        </a>

                                        <Link
                                          href={`/train/${paper.id}`}
                                          className={buttonVariants({
                                            variant: selectForProblemMode ? "outline" : "default",
                                            size: "sm",
                                            className:
                                              "min-h-[36px] sm:min-h-0 h-8 px-3 gap-1 text-xs font-semibold",
                                          })}
                                          title="Open in Train! Practice Workspace"
                                        >
                                          <span>Train!</span>
                                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                                        </Link>
                                      </>
                                    ) : (
                                      <>
                                        {onView && paper.file_url && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="min-h-[36px] sm:min-h-0 h-8 px-2.5 gap-1.5 text-xs font-semibold"
                                            onClick={() =>
                                              onView({
                                                paper,
                                                title: paper.file_name || title,
                                                url: paper.file_url!,
                                                downloadUrl: paper.download_url,
                                              })
                                            }
                                          >
                                            <Eye className="size-3.5" aria-hidden="true" />
                                            <span>Preview</span>
                                          </Button>
                                        )}

                                        {isSelected ? (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="default"
                                            className="min-h-[36px] sm:min-h-0 h-8 px-3 gap-1.5 text-xs font-semibold"
                                            disabled
                                          >
                                            <Check className="size-3.5" aria-hidden="true" />
                                            <span>Selected</span>
                                          </Button>
                                        ) : (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="default"
                                            className="min-h-[36px] sm:min-h-0 h-8 px-3 gap-1.5 text-xs font-semibold"
                                            onClick={() => onSelectPaper?.(paper)}
                                          >
                                            <span>Select Paper</span>
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
