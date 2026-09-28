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
    <div className="rounded-2xl border border-line bg-card p-6 shadow-xs transition-all flex flex-col gap-6">
      {/* Header & Strategic Health KPIs */}
      <div className="flex flex-col gap-4 border-b border-line/60 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Zap className="size-4" />
              </div>
              <h3 className="text-lg font-semibold text-ink">
                Curriculum Operational Triage Board
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Live operational triage across Subject × Level catalog. Select an education level to focus triage, or filter by specific bottlenecks.
            </p>
          </div>

          {/* Quick Health Summary KPIs */}
          <div className="flex flex-wrap items-center gap-2">
            {unansweredGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {totalUnansweredProblems} Unanswered Across {unansweredGaps.length} Topics
              </div>
            )}
            {zeroLessonGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted">
                <BookOpen className="size-3.5 text-primary" />
                {zeroLessonGaps.length} Missing Lessons
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              {healthyCount} Active & Balanced
            </div>
          </div>
        </div>

        {/* PRIMARY CONTROLS: Education Level Tabs */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
              <GraduationCap className="size-3.5 text-primary" /> Education Level Scope
            </span>
            {selectedLevelId !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedLevelId("ALL")}
                className="text-[11px] font-medium text-primary hover:underline transition-colors"
              >
                Reset to All Levels ({matrix.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-line bg-surface/70 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLevelId("ALL")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                selectedLevelId === "ALL"
                  ? "bg-card text-ink font-semibold shadow-xs border border-line"
                  : "text-ink-muted hover:text-ink hover:bg-card/50"
              )}
            >
              <span>All Levels</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  selectedLevelId === "ALL"
                    ? "bg-muted text-ink font-bold"
                    : "bg-muted/50 text-ink-muted"
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
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                    isSelected
                      ? "bg-card text-ink font-semibold shadow-xs border border-line"
                      : "text-ink-muted hover:text-ink hover:bg-card/50"
                  )}
                >
                  <span>{lvl.name}</span>
                  <span className="text-[10px] text-ink-muted font-mono">({lvl.code})</span>
                  {lvl.unansweredCount > 0 ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30">
                      <AlertTriangle className="size-2.5" />
                      {lvl.unansweredCount}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted/60 text-ink-muted">
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
          <div className="inline-flex rounded-xl border border-line bg-surface/60 p-1 text-xs font-medium overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterView("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                filterView === "all"
                  ? "bg-card text-ink font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              All Topics ({scopedMatrix.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("gaps")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                filterView === "gaps"
                  ? "bg-card text-amber-600 dark:text-amber-400 font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <AlertTriangle className="size-3 text-amber-500" />
              Needs Attention ({unansweredGaps.length + zeroLessonGaps.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("unanswered")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                filterView === "unanswered"
                  ? "bg-card text-amber-600 dark:text-amber-400 font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              Unanswered ({unansweredGaps.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("missing_lessons")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                filterView === "missing_lessons"
                  ? "bg-card text-primary font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              Missing Lessons ({zeroLessonGaps.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("dormant")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                filterView === "dormant"
                  ? "bg-card text-ink-muted font-semibold shadow-xs"
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
                          className="font-semibold text-ink hover:text-primary hover:underline text-left text-xs"
                        >
                          {item.subject_name}
                        </button>
                        <Badge variant="outline" className="text-[10px] py-0 font-mono">
                          {item.level_code}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-ink-muted mt-0.5">
                        {item.level_name} • #{item.subject_code}
                      </div>
                    </td>

                    {/* Unanswered Problems */}
                    <td className="p-3 text-center">
                      {hasUnanswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="size-3" />
                          {item.unanswered_problems_count} Unanswered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="size-3" /> All Solved
                        </span>
                      )}
                    </td>

                    {/* Problems & Solutions */}
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-ink">
                          {item.problems_count} problems / {item.solutions_count} sols
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {(item.avg_solutions_per_problem || 0).toFixed(1)}x ratio
                        </span>
                      </div>
                    </td>

                    {/* Lessons */}
                    <td className="p-3 text-center">
                      {hasZeroLessons ? (
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] py-0">
                          0 Lessons
                        </Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                          <BookOpen className="size-3 text-primary" />
                          {item.lessons_count}
                        </span>
                      )}
                    </td>

                    {/* Forum Activity */}
                    <td className="p-3 text-center">
                      <span className="text-[11px] text-ink-muted">
                        {item.posts_count} posts
                      </span>
                    </td>

                    {/* Health Status */}
                    <td className="p-3 text-center">
                      {hasUnanswered ? (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] py-0">
                          Bottleneck
                        </Badge>
                      ) : hasZeroLessons ? (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] py-0">
                          Needs Lesson
                        </Badge>
                      ) : isDormant ? (
                        <Badge variant="secondary" className="text-[10px] py-0 text-ink-muted">
                          Dormant
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0">
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
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h4 className="font-bold text-base text-ink">{selectedCell.subject_name}</h4>
                <p className="text-xs text-ink-muted">
                  {selectedCell.level_name} ({selectedCell.level_code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 rounded-xl border border-line bg-surface">
                <span className="text-[11px] text-ink-muted block mb-1">Unanswered Challenges</span>
                <span
                  className={cn(
                    "text-xl font-bold",
                    (selectedCell.unanswered_problems_count || 0) > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {selectedCell.unanswered_problems_count || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface">
                <span className="text-[11px] text-ink-muted block mb-1">Published Lessons</span>
                <span className="text-xl font-bold text-ink">
                  {selectedCell.lessons_count || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface">
                <span className="text-[11px] text-ink-muted block mb-1">Total Problems</span>
                <span className="text-xl font-bold text-ink">
                  {selectedCell.problems_count || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface">
                <span className="text-[11px] text-ink-muted block mb-1">Total Solutions</span>
                <span className="text-xl font-bold text-ink">
                  {selectedCell.solutions_count || 0}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <Link
                href={`/problems?subject=${selectedCell.subject_id}&level=${selectedCell.level_id}&status=OPEN`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs hover:bg-amber-500/20 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Eye className="size-4" /> View Unanswered Challenges ({selectedCell.unanswered_problems_count || 0})
                </span>
                <ArrowRight className="size-3.5" />
              </Link>

              <Link
                href={`/lessons/new?level=${selectedCell.level_id}&subject=${selectedCell.subject_id}`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-line hover:bg-muted text-ink font-semibold text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <PlusCircle className="size-4 text-primary" /> Create Lesson for this Topic
                </span>
                <ArrowRight className="size-3.5" />
              </Link>

              <Link
                href={`/admin/resources?level=${selectedCell.level_code}&subject=${selectedCell.subject_code}`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-line hover:bg-muted text-ink font-semibold text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileUp className="size-4 text-blue-500" /> Ingest Past Papers & Textbooks
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
