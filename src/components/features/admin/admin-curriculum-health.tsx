"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MatrixItem,
  SubjectAnalytics,
  LevelAnalytics,
} from "./admin-analytics-types";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Search,
  Zap,
  ArrowRight,
  X,
  FileUp,
  PlusCircle,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AdminCurriculumHealthProps {
  matrix: MatrixItem[];
  subjects: SubjectAnalytics[];
  levels: LevelAnalytics[];
}

type FilterView = "all" | "gaps" | "unanswered" | "missing_lessons" | "dormant";
type SortField = "priority" | "topic" | "unanswered" | "problems" | "lessons" | "posts" | "health";
type SortDirection = "asc" | "desc";

export function AdminCurriculumHealth({
  matrix,
  subjects,
  levels,
}: AdminCurriculumHealthProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("ALL");
  const [filterView, setFilterView] = useState<FilterView>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCell, setSelectedCell] = useState<MatrixItem | null>(null);
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Extract distinct levels with aggregated stats for the level tabs
  const levelTabs = useMemo(() => {
    const list: Array<{ id: string; name: string; code: string; totalTopics: number; unansweredCount: number }> = [];
    const seen = new Set<string>();

    // First populate from levels prop to preserve taxonomy order
    levels.forEach((l) => {
      seen.add(l.id);
      const lvlTopics = matrix.filter((m) => m.level_id === l.id);
      const unans = lvlTopics.reduce((acc, m) => acc + (m.unanswered_problems_count || 0), 0);
      list.push({
        id: l.id,
        name: l.name,
        code: l.code,
        totalTopics: lvlTopics.length,
        unansweredCount: unans,
      });
    });

    // Catch any remaining matrix items that might not be in levels prop
    matrix.forEach((m) => {
      if (!seen.has(m.level_id)) {
        seen.add(m.level_id);
        const lvlTopics = matrix.filter((x) => x.level_id === m.level_id);
        const unans = lvlTopics.reduce((acc, x) => acc + (x.unanswered_problems_count || 0), 0);
        list.push({
          id: m.level_id,
          name: m.level_name,
          code: m.level_code,
          totalTopics: lvlTopics.length,
          unansweredCount: unans,
        });
      }
    });

    return list;
  }, [levels, matrix]);

  // Overall and current level-scoped KPIs
  const {
    scopedMatrix,
    unansweredGaps,
    zeroLessonGaps,
    dormantGaps,
    healthyCount,
    totalUnansweredProblems,
  } = useMemo(() => {
    // 1. Scope matrix by selected education level
    const scoped = selectedLevelId === "ALL"
      ? matrix
      : matrix.filter((item) => item.level_id === selectedLevelId);

    const unanswered: MatrixItem[] = [];
    const zeroLesson: MatrixItem[] = [];
    const dormant: MatrixItem[] = [];
    let healthy = 0;
    let totalUnans = 0;

    scoped.forEach((item) => {
      const uCount = item.unanswered_problems_count || 0;
      totalUnans += uCount;
      if (uCount > 0) {
        unanswered.push(item);
      } else if (item.lessons_count === 0 && item.total_activity > 0) {
        zeroLesson.push(item);
      } else if (item.total_activity === 0) {
        dormant.push(item);
      } else {
        healthy++;
      }
    });

    return {
      scopedMatrix: scoped,
      unansweredGaps: unanswered,
      zeroLessonGaps: zeroLesson,
      dormantGaps: dormant,
      healthyCount: healthy,
      totalUnansweredProblems: totalUnans,
    };
  }, [matrix, selectedLevelId]);

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filtered and Sorted rows for the operational triage table
  const filteredAndSortedRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Filter
    const filtered = scopedMatrix.filter((item) => {
      const matchesSearch =
        !q ||
        item.subject_name.toLowerCase().includes(q) ||
        item.level_name.toLowerCase().includes(q) ||
        item.subject_code.toLowerCase().includes(q) ||
        item.level_code.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterView === "gaps") {
        return (
          (item.unanswered_problems_count || 0) > 0 ||
          (item.lessons_count === 0 && item.total_activity > 0)
        );
      }
      if (filterView === "unanswered") {
        return (item.unanswered_problems_count || 0) > 0;
      }
      if (filterView === "missing_lessons") {
        return item.lessons_count === 0 && item.total_activity > 0;
      }
      if (filterView === "dormant") {
        return item.total_activity === 0;
      }

      return true;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;

      if (sortField === "priority") {
        // High deficit first: unanswered desc -> missing lessons -> active -> dormant
        const aScore = (a.unanswered_problems_count || 0) * 100 + (a.lessons_count === 0 && a.total_activity > 0 ? 50 : 0) + (a.total_activity > 0 ? 10 : 0);
        const bScore = (b.unanswered_problems_count || 0) * 100 + (b.lessons_count === 0 && b.total_activity > 0 ? 50 : 0) + (b.total_activity > 0 ? 10 : 0);
        return (bScore - aScore) * dir;
      }
      if (sortField === "topic") {
        return a.subject_name.localeCompare(b.subject_name) * dir;
      }
      if (sortField === "unanswered") {
        return ((a.unanswered_problems_count || 0) - (b.unanswered_problems_count || 0)) * dir;
      }
      if (sortField === "problems") {
        return ((a.problems_count || 0) - (b.problems_count || 0)) * dir;
      }
      if (sortField === "lessons") {
        return ((a.lessons_count || 0) - (b.lessons_count || 0)) * dir;
      }
      if (sortField === "posts") {
        return ((a.posts_count || 0) - (b.posts_count || 0)) * dir;
      }
      if (sortField === "health") {
        const getHealthRank = (m: MatrixItem) => {
          if (m.unanswered_problems_count > 0) return 3; // Bottleneck
          if (m.lessons_count === 0 && m.total_activity > 0) return 2; // Needs lesson
          if (m.total_activity === 0) return 1; // Dormant
          return 0; // Balanced
        };
        return (getHealthRank(a) - getHealthRank(b)) * dir;
      }
      return 0;
    });
  }, [scopedMatrix, searchQuery, filterView, sortField, sortDirection]);

  const activeLevelMeta = levelTabs.find((l) => l.id === selectedLevelId);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-6">
      {/* Header & Strategic Health KPIs */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                <Zap className="size-4" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Curriculum Operational Triage Board
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Live operational triage across Subject × Level catalog. Select an education level to focus triage, or filter by specific bottlenecks.
            </p>
          </div>

          {/* Quick Health Summary KPIs */}
          <div className="flex flex-wrap items-center gap-2">
            {unansweredGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-1.5 font-mono tabular-nums text-xs font-semibold text-warning">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                {totalUnansweredProblems} Unanswered Across {unansweredGaps.length} Topics
              </div>
            )}
            {zeroLessonGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-1.5 font-mono tabular-nums text-xs font-medium text-muted-foreground">
                <BookOpen className="size-3.5 text-primary" aria-hidden="true" />
                {zeroLessonGaps.length} Missing Lessons
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono tabular-nums text-xs font-semibold text-primary">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {healthyCount} Active &amp; Balanced
            </div>
          </div>
        </div>

        {/* PRIMARY CONTROLS: Education Level Tabs */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
              <GraduationCap className="size-3.5 text-primary" aria-hidden="true" /> Education Level Scope
            </span>
            {selectedLevelId !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedLevelId("ALL")}
                className="text-[11px] font-medium text-primary hover:underline transition-colors cursor-pointer"
              >
                Reset to All Levels ({matrix.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-muted/30 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLevelId("ALL")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
                selectedLevelId === "ALL"
                  ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <span>All Levels</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full font-mono tabular-nums text-[10px]",
                  selectedLevelId === "ALL"
                    ? "bg-muted text-foreground font-bold"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {matrix.length}
              </span>
            </button>
            {levelTabs.map((lvl) => {
              const isSelected = selectedLevelId === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevelId(lvl.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
                    isSelected
                      ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <span>{lvl.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({lvl.code})</span>
                  {lvl.unansweredCount > 0 ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full font-mono tabular-nums text-[10px] bg-warning/15 text-warning font-bold border border-warning/30">
                      <AlertTriangle className="size-2.5" aria-hidden="true" />
                      {lvl.unansweredCount}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-full font-mono tabular-nums text-[10px] bg-muted/60 text-muted-foreground">
                      {lvl.totalTopics}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECONDARY CONTROLS: Deficit Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Deficit Filter Pills */}
          <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1 text-xs font-medium overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterView("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                filterView === "all"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Topics (<span className="font-mono tabular-nums">{scopedMatrix.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilterView("gaps")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                filterView === "gaps"
                  ? "bg-card text-warning font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlertTriangle className="size-3 text-warning" aria-hidden="true" />
              Needs Attention (<span className="font-mono tabular-nums">{unansweredGaps.length + zeroLessonGaps.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilterView("unanswered")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                filterView === "unanswered"
                  ? "bg-card text-warning font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Unanswered (<span className="font-mono tabular-nums">{unansweredGaps.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilterView("missing_lessons")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                filterView === "missing_lessons"
                  ? "bg-card text-primary font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Missing Lessons (<span className="font-mono tabular-nums">{zeroLessonGaps.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilterView("dormant")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                filterView === "dormant"
                  ? "bg-card text-muted-foreground font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              Dormant ({dormantGaps.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder={
                selectedLevelId === "ALL"
                  ? "Filter subject or level..."
                  : `Search within ${activeLevelMeta?.code || "level"}...`
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-line bg-surface text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Scope Info Banner (when scoped to a single level) */}
      {selectedLevelId !== "ALL" && activeLevelMeta && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary/5 border border-primary/15 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <span className="font-semibold text-ink">
              Showing curriculum for: {activeLevelMeta.name} ({activeLevelMeta.code})
            </span>
            <span className="text-ink-muted">• {scopedMatrix.length} subjects enrolled</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLevelId("ALL")}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Show All Levels
          </button>
        </div>
      )}

      {/* Triage Board Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/30">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface border-b border-line text-ink-muted uppercase font-semibold text-[10px] tracking-wider select-none">
            <tr>
              <th className="p-3">
                <button
                  type="button"
                  onClick={() => handleSort("topic")}
                  className="flex items-center gap-1 hover:text-ink transition-colors"
                >
                  <span>Academic Topic</span>
                  {sortField === "topic" ? (
                    sortDirection === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="size-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="p-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("unanswered")}
                  className="flex items-center gap-1 mx-auto hover:text-ink transition-colors"
                >
                  <span>Unanswered Bottlenecks</span>
                  {sortField === "unanswered" ? (
                    sortDirection === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="size-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="p-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("problems")}
                  className="flex items-center gap-1 mx-auto hover:text-ink transition-colors"
                >
                  <span>Challenge Coverage</span>
                  {sortField === "problems" ? (
                    sortDirection === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="size-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="p-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("lessons")}
                  className="flex items-center gap-1 mx-auto hover:text-ink transition-colors"
                >
                  <span>Lessons</span>
                  {sortField === "lessons" ? (
                    sortDirection === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="size-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="p-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("posts")}
                  className="flex items-center gap-1 mx-auto hover:text-ink transition-colors"
                >
                  <span>Forum Activity</span>
                  {sortField === "posts" ? (
                    sortDirection === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="size-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="p-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("health")}
                  className="flex items-center gap-1 mx-auto hover:text-ink transition-colors"
                >
                  <span>Health Status</span>
                  {sortField === "health" ? (
                    sortDirection === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="size-3 opacity-40" />
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredAndSortedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">
                  No topics matching the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredAndSortedRows.map((item, idx) => {
                const hasUnanswered = (item.unanswered_problems_count || 0) > 0;
                const hasZeroLessons = item.lessons_count === 0 && item.total_activity > 0;
                const isDormant = item.total_activity === 0;

                return (
                  <tr
                    key={`${item.subject_id}-${item.level_id}-${idx}`}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Topic Name */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCell(item)}
                          className="font-semibold text-foreground hover:text-primary hover:underline text-left text-xs cursor-pointer"
                        >
                          {item.subject_name}
                        </button>
                        <Badge variant="outline" className="text-[10px] py-0 font-mono">
                          {item.level_code}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {item.level_name} • #{item.subject_code}
                      </div>
                    </td>

                    {/* Unanswered Problems */}
                    <td className="p-3 text-center">
                      {hasUnanswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono tabular-nums text-xs font-bold bg-warning/10 text-warning border border-warning/20">
                          <AlertTriangle className="size-3" aria-hidden="true" />
                          {item.unanswered_problems_count} Unanswered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                          <CheckCircle2 className="size-3" aria-hidden="true" /> All Answered
                        </span>
                      )}
                    </td>

                    {/* Problems & Solutions */}
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono tabular-nums font-semibold text-foreground">
                          {item.problems_count} problems / {item.solutions_count} sols
                        </span>
                        <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                          {(item.avg_solutions_per_problem || 0).toFixed(1)}x ratio
                        </span>
                      </div>
                    </td>

                    {/* Lessons */}
                    <td className="p-3 text-center">
                      {hasZeroLessons ? (
                        <Badge variant="destructive" className="font-mono tabular-nums text-[10px] py-0">
                          0 Lessons
                        </Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[11px] font-medium text-foreground">
                          <BookOpen className="size-3 text-primary" aria-hidden="true" />
                          {item.lessons_count}
                        </span>
                      )}
                    </td>

                    {/* Forum Activity */}
                    <td className="p-3 text-center">
                      <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                        {item.posts_count} posts
                      </span>
                    </td>

                    {/* Health Status */}
                    <td className="p-3 text-center">
                      {hasUnanswered ? (
                        <Badge variant="warning" className="text-[10px] py-0">
                          Bottleneck
                        </Badge>
                      ) : hasZeroLessons ? (
                        <Badge variant="outline" className="border-chart-3/30 bg-chart-3/10 text-chart-3 text-[10px] py-0">
                          Needs Lesson
                        </Badge>
                      ) : isDormant ? (
                        <Badge variant="secondary" className="text-[10px] py-0 text-muted-foreground">
                          Dormant
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] py-0">
                          Balanced
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drilldown Modal */}
      <Dialog open={Boolean(selectedCell)} onOpenChange={(nextOpen) => !nextOpen && setSelectedCell(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-6 shadow-modal">
          {selectedCell && (
            <>
              <DialogHeader className="pb-3 border-b border-border mb-1">
                <DialogTitle className="font-bold text-base text-foreground">
                  {selectedCell.subject_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedCell.level_name} ({selectedCell.level_code})
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-xs my-2">
                <div className="p-3 rounded-xl border border-border bg-muted/30">
                  <span className="text-[11px] text-muted-foreground block mb-1">Unanswered Challenges</span>
                  <span
                    className={cn(
                      "font-mono tabular-nums text-xl font-bold",
                      (selectedCell.unanswered_problems_count || 0) > 0
                        ? "text-warning"
                        : "text-primary"
                    )}
                  >
                    {selectedCell.unanswered_problems_count || 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30">
                  <span className="text-[11px] text-muted-foreground block mb-1">Published Lessons</span>
                  <span className="font-mono tabular-nums text-xl font-bold text-foreground">
                    {selectedCell.lessons_count || 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30">
                  <span className="text-[11px] text-muted-foreground block mb-1">Total Problems</span>
                  <span className="font-mono tabular-nums text-xl font-bold text-foreground">
                    {selectedCell.problems_count || 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30">
                  <span className="text-[11px] text-muted-foreground block mb-1">Total Solutions</span>
                  <span className="font-mono tabular-nums text-xl font-bold text-foreground">
                    {selectedCell.solutions_count || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <Link
                  href={`/problems?subject=${selectedCell.subject_id}&level=${selectedCell.level_id}&confidence=needs_help`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-warning/10 text-warning font-semibold text-xs hover:bg-warning/20 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="size-4" aria-hidden="true" /> View Needing Help (
                    <span className="font-mono tabular-nums">{selectedCell.unanswered_problems_count || 0}</span> unanswered)
                  </span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>

                <Link
                  href={`/lessons/new?level=${selectedCell.level_id}&subject=${selectedCell.subject_id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="size-4 text-primary" aria-hidden="true" /> Create Lesson for this Topic
                  </span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>

                <Link
                  href={`/admin/resources?level=${selectedCell.level_code}&subject=${selectedCell.subject_code}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileUp className="size-4 text-chart-3" aria-hidden="true" /> Ingest Past Papers & Textbooks
                  </span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
