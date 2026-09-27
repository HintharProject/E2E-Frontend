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
  Filter,
  Search,
  Zap,
  ArrowRight,
  X,
  MessageSquare,
  HelpCircle,
  CheckCheck,
  FileUp,
  ExternalLink,
  PlusCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminCurriculumHealthProps {
  matrix: MatrixItem[];
  subjects: SubjectAnalytics[];
  levels: LevelAnalytics[];
}

type FilterView = "all" | "gaps" | "unanswered" | "missing_lessons";

export function AdminCurriculumHealth({
  matrix,
  subjects,
  levels,
}: AdminCurriculumHealthProps) {
  const [filterView, setFilterView] = useState<FilterView>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCell, setSelectedCell] = useState<MatrixItem | null>(null);

  // Triage Categorization
  const {
    unansweredGaps,
    zeroLessonGaps,
    dormantGaps,
    healthyCount,
    totalUnansweredProblems,
  } = useMemo(() => {
    const unanswered: MatrixItem[] = [];
    const zeroLesson: MatrixItem[] = [];
    const dormant: MatrixItem[] = [];
    let healthy = 0;
    let totalUnans = 0;

    matrix.forEach((item) => {
      totalUnans += item.unanswered_problems_count || 0;
      if (item.unanswered_problems_count > 0) {
        unanswered.push(item);
      } else if (item.lessons_count === 0 && item.total_activity > 0) {
        zeroLesson.push(item);
      } else if (item.total_activity === 0) {
        dormant.push(item);
      } else {
        healthy++;
      }
    });

    unanswered.sort((a, b) => b.unanswered_problems_count - a.unanswered_problems_count);
    zeroLesson.sort((a, b) => b.total_activity - a.total_activity);

    return {
      unansweredGaps: unanswered,
      zeroLessonGaps: zeroLesson,
      dormantGaps: dormant,
      healthyCount: healthy,
      totalUnansweredProblems: totalUnans,
    };
  }, [matrix]);

  // Filtered rows for the operational triage table
  const filteredRows = useMemo(() => {
    return matrix.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.subject_name.toLowerCase().includes(q) ||
        item.level_name.toLowerCase().includes(q) ||
        item.subject_code.toLowerCase().includes(q) ||
        item.level_code.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterView === "gaps") {
        return (
          item.unanswered_problems_count > 0 ||
          (item.lessons_count === 0 && item.total_activity > 0)
        );
      }
      if (filterView === "unanswered") {
        return item.unanswered_problems_count > 0;
      }
      if (filterView === "missing_lessons") {
        return item.lessons_count === 0 && item.total_activity > 0;
      }

      return true;
    });
  }, [matrix, searchQuery, filterView]);

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
              Live operational triage across Subject × Level catalog. Direct links to resolve unanswered bottlenecks, draft lessons, and ingest exam papers.
            </p>
          </div>

          {/* Quick Health Summary KPIs */}
          <div className="flex flex-wrap items-center gap-2">
            {unansweredGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {totalUnansweredProblems} Unanswered Across {unansweredGaps.length} Sectors
              </div>
            )}
            {zeroLessonGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted">
                <BookOpen className="size-3.5 text-primary" />
                {zeroLessonGaps.length} Topics Missing Lessons
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              {healthyCount} Active & Balanced
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Filter Pills */}
          <div className="inline-flex rounded-xl border border-line bg-surface/60 p-1 text-xs font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterView("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterView === "all"
                  ? "bg-card text-ink font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              All Topics ({matrix.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("gaps")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                filterView === "gaps"
                  ? "bg-card text-amber-600 dark:text-amber-400 font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <AlertTriangle className="size-3 text-amber-500" />
              Needs Attention ({unansweredGaps.length + zeroLessonGaps.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("unanswered")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                filterView === "unanswered"
                  ? "bg-card text-amber-600 dark:text-amber-400 font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Unanswered ({unansweredGaps.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("missing_lessons")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                filterView === "missing_lessons"
                  ? "bg-card text-primary font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Missing Lessons ({zeroLessonGaps.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Filter subject or level..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-line bg-surface text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Triage Board Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/30">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface border-b border-line text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Academic Topic</th>
              <th className="p-3 text-center">Unanswered Bottlenecks</th>
              <th className="p-3 text-center">Challenge Coverage</th>
              <th className="p-3 text-center">Lessons</th>
              <th className="p-3 text-center">Forum Activity</th>
              <th className="p-3 text-center">Health Status</th>
              <th className="p-3 text-right">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted">
                  No topics matching the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((item, idx) => {
                const hasUnanswered = item.unanswered_problems_count > 0;
                const hasZeroLessons = item.lessons_count === 0 && item.total_activity > 0;
                const isDormant = item.total_activity === 0;

                return (
                  <tr
                    key={idx}
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
                          {item.avg_solutions_per_problem.toFixed(1)}x ratio
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

                    {/* Operational Action Shortcuts */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasUnanswered && (
                          <Link
                            href={`/problems?subject=${item.subject_code}&level=${item.level_code}&status=UNSOLVED`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors border border-amber-500/20 shrink-0"
                          >
                            <Eye className="size-3" /> View Unanswered
                          </Link>
                        )}

                        <Link
                          href={`/lessons/new?level=${item.level_code}&subject=${item.subject_code}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-ink-muted hover:text-ink hover:bg-muted transition-colors shrink-0"
                          title="Draft lesson for this topic"
                        >
                          <PlusCircle className="size-3 text-primary" /> Add Lesson
                        </Link>

                        <Link
                          href={`/admin/resources?level=${item.level_code}&subject=${item.subject_code}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-ink-muted hover:text-ink hover:bg-muted transition-colors shrink-0"
                          title="Upload past papers or textbooks"
                        >
                          <FileUp className="size-3 text-blue-500" /> Upload Papers
                        </Link>
                      </div>
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
                <span className={`text-xl font-bold ${
                  selectedCell.unanswered_problems_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {selectedCell.unanswered_problems_count}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface">
                <span className="text-[11px] text-ink-muted block mb-1">Published Lessons</span>
                <span className="text-xl font-bold text-ink">
                  {selectedCell.lessons_count}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface">
                <span className="text-[11px] text-ink-muted block mb-1">Total Problems</span>
                <span className="text-xl font-bold text-ink">
                  {selectedCell.problems_count}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface">
                <span className="text-[11px] text-ink-muted block mb-1">Total Solutions</span>
                <span className="text-xl font-bold text-ink">
                  {selectedCell.solutions_count}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <Link
                href={`/problems?subject=${selectedCell.subject_code}&level=${selectedCell.level_code}&status=UNSOLVED`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs hover:bg-amber-500/20 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Eye className="size-4" /> View Unanswered Challenges ({selectedCell.unanswered_problems_count})
                </span>
                <ArrowRight className="size-3.5" />
              </Link>

              <Link
                href={`/lessons/new?level=${selectedCell.level_code}&subject=${selectedCell.subject_code}`}
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
