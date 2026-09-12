"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Resource } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocTypeIcon } from "@/components/features/resources/doc-type-icon";
import { ViewingDocument } from "@/components/features/resources/document-viewer-modal";
import { YEARS as ALL_YEARS, getFileExtension } from "@/lib/resources";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Eye,
  Download,
  Check,
} from "lucide-react";

export function formatSession(s?: string): string {
  if (s === "MAY_JUNE") return "May / June";
  if (s === "OCT_NOV") return "Oct / Nov";
  if (s === "JANUARY") return "January";
  return s || "";
}

export interface PastPapersFolderViewProps {
  papers: Resource[];
  variant?: "browse" | "select";
  selectedPaperId?: string;
  onSelectPaper?: (paper: Resource) => void;
  onView?: (doc: ViewingDocument) => void;
  emptyMessage?: string;
  className?: string;
}

export function PastPapersFolderView({
  papers,
  variant = "browse",
  selectedPaperId,
  onSelectPaper,
  onView,
  emptyMessage = "No past papers available.",
  className = "",
}: PastPapersFolderViewProps) {
  // Discover all unique years present, sorted descending
  const allYears = useMemo(() => {
    const yearsSet = new Set<number>(ALL_YEARS);
    papers.forEach((p) => {
      if (p.year) yearsSet.add(p.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [papers]);

  // Group papers by Year
  const papersByYear = useMemo(() => {
    const map: Record<number, Resource[]> = {};
    for (const y of allYears) {
      map[y] = [];
    }
    for (const p of papers) {
      if (p.year && map[p.year]) {
        map[p.year].push(p);
      } else if (p.year) {
        map[p.year] = [p];
      }
    }
    return map;
  }, [papers, allYears]);

  // Expanded Year folders state: default expand years with papers (or recent years)
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {
      2026: true,
      2025: true,
      2024: true,
      2023: true,
    };
    for (const p of papers) {
      if (p.year) initial[p.year] = true;
    }
    return initial;
  });

  // Whenever papers update, ensure folders containing papers are expanded
  useEffect(() => {
    if (papers.length > 0) {
      setExpandedYears((prev) => {
        const next = { ...prev };
        for (const p of papers) {
          if (p.year && next[p.year] === undefined) {
            next[p.year] = true;
          }
        }
        return next;
      });
    }
  }, [papers]);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  if (papers.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-card/60 p-8 text-center">
        <p className="text-xs text-ink-muted italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {allYears.map((y) => {
        const yearPapers = papersByYear[y] || [];
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
              <div className="flex items-center justify-center size-8 rounded-lg bg-surface border border-line text-primary shrink-0">
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
                <Badge
                  variant={yearPapers.length > 0 ? "secondary" : "outline"}
                  className="text-xs font-semibold"
                >
                  {yearPapers.length} {yearPapers.length === 1 ? "paper" : "papers"}
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
                {yearPapers.length === 0 ? (
                  <p className="text-xs text-ink-muted text-center py-4 italic">
                    No past papers uploaded for {y} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-line border border-line rounded-xl bg-card overflow-hidden">
                    {yearPapers.map((paper) => {
                      const ext = getFileExtension(paper.file_name || "");
                      const isSelected = selectedPaperId === paper.id;
                      const title = paper.title || paper.file_name || "Past Paper";

                      return (
                        <div
                          key={paper.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-muted/40 transition-colors group ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
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
                                className="font-medium text-ink text-sm truncate"
                                title={paper.file_name}
                              >
                                {title}
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

                          {/* Action Buttons based on Variant */}
                          <div className="flex items-center justify-end gap-2 shrink-0 sm:self-center">
                            {variant === "browse" ? (
                              <>
                                {/* View In-App Modal */}
                                {onView && paper.file_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                                    onClick={() =>
                                      onView({
                                        paper,
                                        title: paper.file_name || title,
                                        url: paper.file_url!,
                                        downloadUrl: (paper as any).download_url,
                                      })
                                    }
                                  >
                                    <Eye className="size-3.5" />
                                    <span>View</span>
                                  </Button>
                                )}

                                {/* Download Link */}
                                <a
                                  href={(paper as any).download_url || paper.file_url}
                                  download={paper.file_name || title}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={buttonVariants({
                                    variant: "secondary",
                                    size: "sm",
                                    className:
                                      "h-8 px-2.5 gap-1.5 text-xs font-semibold shadow-2xs hover:bg-primary hover:text-primary-foreground transition-colors",
                                  })}
                                >
                                  <Download className="size-3.5" />
                                  <span>Download</span>
                                </a>
                              </>
                            ) : (
                              <>
                                {/* Selection Variant: Preview + Select */}
                                {onView && paper.file_url && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                                    onClick={() =>
                                      onView({
                                        paper,
                                        title: paper.file_name || title,
                                        url: paper.file_url!,
                                        downloadUrl: (paper as any).download_url,
                                      })
                                    }
                                  >
                                    <Eye className="size-3.5" />
                                    <span>Preview</span>
                                  </Button>
                                )}

                                {isSelected ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    className="h-8 px-3 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                    disabled
                                  >
                                    <Check className="size-3.5" />
                                    <span>Selected</span>
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    className="h-8 px-3 gap-1.5 text-xs font-semibold shadow-xs"
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
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
