"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useTrainTree,
  useAttemptedIds,
  useAttemptSummary,
} from "@/hooks/use-train";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FileText,
  BookOpen,
  MessageSquare,
  Trophy,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainTreePaper } from "@/types";

interface CurriculumTreeSidebarProps {
  activePaperId?: string | null;
  leftPaperId?: string | null;
  rightPaperId?: string | null;
  onToggleLeft?: (paper: TrainTreePaper) => void;
  onToggleRight?: (paper: TrainTreePaper) => void;
  subjectId?: string | null;
  levelId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CurriculumTreeSidebar({
  activePaperId,
  leftPaperId,
  rightPaperId,
  onToggleLeft,
  onToggleRight,
  subjectId,
  levelId,
  isOpen,
  onClose,
}: CurriculumTreeSidebarProps) {
  const { data: treeData, isLoading: isTreeLoading } = useTrainTree(subjectId, levelId);
  const { data: attemptedData } = useAttemptedIds(subjectId, levelId);
  const targetId = leftPaperId !== undefined ? (leftPaperId || rightPaperId || null) : (activePaperId || null);
  const { data: summaryData } = useAttemptSummary(targetId || undefined);

  const [searchQuery, setSearchQuery] = useState("");

  // Determine which year should be expanded by default (the active paper's year or latest)
  const defaultExpandedYear = useMemo(() => {
    if (!treeData?.years) return undefined;
    const currentActiveId = leftPaperId !== undefined ? (leftPaperId || rightPaperId) : activePaperId;
    if (currentActiveId) {
      for (const y of treeData.years) {
        for (const s of y.sessions) {
          if (s.papers.some((p) => p.id === currentActiveId)) {
            return y.year;
          }
        }
      }
    }
    return treeData.years[0]?.year;
  }, [treeData, leftPaperId, activePaperId, rightPaperId]);

  const [toggledYears, setToggledYears] = useState<Record<number, boolean>>({});

  const toggleYear = (year: number) => {
    setToggledYears((prev) => {
      const current = prev[year] !== undefined ? prev[year] : year === defaultExpandedYear;
      return { ...prev, [year]: !current };
    });
  };

  const attemptedSet = useMemo(() => {
    return new Set(attemptedData?.attempted_resource_ids || []);
  }, [attemptedData]);

  // Filter tree papers by search query
  const filteredYears = useMemo(() => {
    if (!treeData?.years) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return treeData.years;

    return treeData.years
      .map((y) => {
        const matchingSessions = y.sessions
          .map((s) => {
            const matchingPapers = s.papers.filter(
              (p) =>
                (p.paper_code && p.paper_code.toLowerCase().includes(q)) ||
                p.label.toLowerCase().includes(q) ||
                p.file_name.toLowerCase().includes(q)
            );
            return { ...s, papers: matchingPapers };
          })
          .filter((s) => s.papers.length > 0);

        return { ...y, sessions: matchingSessions };
      })
      .filter((y) => y.sessions.length > 0);
  }, [treeData, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed lg:static top-14 bottom-0 left-0 z-40 w-72 sm:w-80 bg-card border-r border-line flex flex-col transition-transform duration-200 ease-in-out shrink-0 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header & Search */}
        <div className="p-3 border-b border-line flex flex-col gap-2.5 bg-surface/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Curriculum Archive
              </span>
              {treeData?.subject && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {treeData.subject.code}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 text-ink-muted hover:text-ink rounded-md"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-ink-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search paper code (e.g. 12)..."
              className="h-8 pl-8 text-xs bg-card border-line placeholder:text-ink-muted"
            />
          </div>
        </div>

        {/* Hierarchy Tree Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-line/30">
          {isTreeLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-ink-muted">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-xs">Loading curriculum tree...</span>
            </div>
          ) : filteredYears.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted italic">
              {searchQuery ? "No matching past papers found." : "No papers in this curriculum."}
            </div>
          ) : (
            filteredYears.map((yearItem) => {
              const isExpanded =
                toggledYears[yearItem.year] !== undefined
                  ? toggledYears[yearItem.year]
                  : yearItem.year === defaultExpandedYear || searchQuery.length > 0;
              const totalPapersInYear = yearItem.sessions.reduce(
                (acc, s) => acc + s.papers.length,
                0
              );

              return (
                <div key={yearItem.year} className="pt-1.5 first:pt-0">
                  {/* Year Header */}
                  <button
                    type="button"
                    onClick={() => toggleYear(yearItem.year)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-ink hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <FolderOpen className="size-3.5 text-primary" />
                      ) : (
                        <Folder className="size-3.5 text-ink-muted" />
                      )}
                      <span>{yearItem.year}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-ink-muted">
                      <span className="text-[10px] font-normal">{totalPapersInYear} papers</span>
                      {isExpanded ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronRight className="size-3" />
                      )}
                    </div>
                  </button>

                  {/* Sessions & Papers Accordion Body */}
                  {isExpanded && (
                    <div className="ml-3 pl-2 border-l border-line/60 my-1 space-y-2">
                      {yearItem.sessions.map((sessionItem) => (
                        <div key={sessionItem.session} className="space-y-1">
                          <span className="block text-[11px] font-medium text-ink-muted/80 px-1.5 pt-1">
                            {sessionItem.session_label}
                          </span>

                          <div className="space-y-0.5">
                            {sessionItem.papers.map((paper) => {
                              const isLeft = leftPaperId !== undefined ? leftPaperId === paper.id : activePaperId === paper.id;
                              const isRight = rightPaperId === paper.id;
                              const isAttempted = attemptedSet.has(paper.id);
                              const isMS = paper.paper_type === "MS" || paper.file_name.toLowerCase().includes("ms");

                              const content = (
                                <>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {isMS ? (
                                      <BookOpen
                                        className={cn(
                                          "size-3.5 shrink-0",
                                          isRight
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-emerald-500"
                                        )}
                                      />
                                    ) : (
                                      <FileText
                                        className={cn(
                                          "size-3.5 shrink-0",
                                          isLeft ? "text-primary" : "text-amber-500"
                                        )}
                                      />
                                    )}
                                    <span className="truncate text-xs font-medium" title={paper.file_name}>
                                      {paper.label}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[9px] px-1 py-0 font-bold uppercase shrink-0 leading-none h-4",
                                        isMS
                                          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                          : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                      )}
                                    >
                                      {paper.paper_type || (isMS ? "MS" : "QP")}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Attempted indicator */}
                                    {isAttempted && (
                                      <span
                                        title="Practice Attempt Recorded"
                                        className="text-emerald-500 flex items-center"
                                      >
                                        <CheckCircle2 className="size-3.5 fill-emerald-500/10" />
                                      </span>
                                    )}

                                    {/* Solutions count indicator */}
                                    {paper.solutions_count > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[9px] px-1 py-0 h-3.5 font-mono font-medium gap-0.5"
                                        title={`${paper.solutions_count} community/staff solutions available`}
                                      >
                                        <MessageSquare className="size-2" />
                                        <span>{paper.solutions_count}</span>
                                      </Badge>
                                    )}

                                    {/* [ L ] and [ R ] toggle buttons */}
                                    {onToggleLeft && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          onToggleLeft(paper);
                                        }}
                                        className={cn(
                                          "h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer",
                                          isLeft
                                            ? "bg-primary text-primary-foreground shadow-xs border border-primary ring-1 ring-primary/40"
                                            : "border border-line/80 bg-surface/80 text-ink-muted hover:text-ink hover:bg-muted"
                                        )}
                                        title={
                                          isLeft
                                            ? "Active on Left. Click to close Left panel."
                                            : "Open paper in Left panel (L)"
                                        }
                                      >
                                        L
                                      </button>
                                    )}

                                    {onToggleRight && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          onToggleRight(paper);
                                        }}
                                        className={cn(
                                          "h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer",
                                          isRight
                                            ? "bg-emerald-600 text-white shadow-xs border border-emerald-600 ring-1 ring-emerald-500/40"
                                            : "border border-line/80 bg-surface/80 text-ink-muted hover:text-ink hover:bg-muted"
                                        )}
                                        title={
                                          isRight
                                            ? "Active on Right. Click to close Right panel."
                                            : "Open paper in Right panel (R)"
                                        }
                                      >
                                        R
                                      </button>
                                    )}
                                  </div>
                                </>
                              );

                              return onToggleLeft ? (
                                <div
                                  key={paper.id}
                                  onClick={() => {
                                    if (isMS && onToggleRight) {
                                      onToggleRight(paper);
                                    } else {
                                      onToggleLeft(paper);
                                    }
                                  }}
                                  className={cn(
                                    "group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border",
                                    isLeft
                                      ? "bg-primary/10 border-primary/30 text-ink font-semibold"
                                      : isRight
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-ink font-semibold"
                                      : "hover:bg-muted/60 text-ink border-transparent"
                                  )}
                                >
                                  {content}
                                </div>
                              ) : (
                                <Link
                                  key={paper.id}
                                  href={`/train/${paper.id}`}
                                  className={cn(
                                    "group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors border",
                                    isLeft
                                      ? "bg-primary/10 border-primary/30 text-ink font-semibold"
                                      : isRight
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-ink font-semibold"
                                      : "hover:bg-muted/60 text-ink border-transparent"
                                  )}
                                >
                                  {content}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Practice Benchmark Summary Card */}
        <div className="p-3 border-t border-line bg-surface/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Trophy className="size-3.5 text-amber-500" />
            <span className="text-[11px] font-bold text-ink uppercase tracking-wider">
              Paper Performance
            </span>
          </div>

          {summaryData && summaryData.total_attempts > 0 ? (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-ink">
                <span className="text-ink-muted">Personal Best:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summaryData.personal_best?.percentage}% ({summaryData.personal_best?.projected_grade})
                </span>
              </div>
              <div className="flex items-center justify-between text-ink">
                <span className="text-ink-muted">Historical Avg:</span>
                <span className="font-medium">{summaryData.average_percentage}%</span>
              </div>
              <div className="flex items-center justify-between text-ink">
                <span className="text-ink-muted">Total Practice Runs:</span>
                <span className="font-medium">{summaryData.total_attempts}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-ink-muted italic leading-relaxed">
              No practice attempts logged for this paper yet. Complete a timed run and self-mark to benchmark your progress!
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
