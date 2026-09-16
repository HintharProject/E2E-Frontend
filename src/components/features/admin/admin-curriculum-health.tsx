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
  Grid,
  Table as TableIcon,
  Zap,
  ArrowRight,
  X,
  MessageSquare,
  HelpCircle,
  CheckCheck,
} from "lucide-react";

interface AdminCurriculumHealthProps {
  matrix: MatrixItem[];
  subjects: SubjectAnalytics[];
  levels: LevelAnalytics[];
}

type HealthTab = "priority" | "heatmap" | "table";

export function AdminCurriculumHealth({
  matrix,
  subjects,
  levels,
}: AdminCurriculumHealthProps) {
  const [activeTab, setActiveTab] = useState<HealthTab>("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [gapsOnly, setGapsOnly] = useState(false);
  const [selectedCell, setSelectedCell] = useState<MatrixItem | null>(null);

  // 1. Triage Categorization
  const {
    unansweredGaps,
    zeroLessonGaps,
    dormantGaps,
    healthyCount,
  } = useMemo(() => {
    const unanswered: MatrixItem[] = [];
    const zeroLesson: MatrixItem[] = [];
    const dormant: MatrixItem[] = [];
    let healthy = 0;

    matrix.forEach((item) => {
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

    // Sort unanswered by severity (highest unanswered first)
    unanswered.sort(
      (a, b) => b.unanswered_problems_count - a.unanswered_problems_count
    );
    // Sort zero lessons by student activity (highest activity first)
    zeroLesson.sort((a, b) => b.total_activity - a.total_activity);

    return {
      unansweredGaps: unanswered,
      zeroLessonGaps: zeroLesson,
      dormantGaps: dormant,
      healthyCount: healthy,
    };
  }, [matrix]);

  // 2. Lookup map for Heatmap Grid: `${subject_id}_${level_id}` -> MatrixItem
  const matrixLookup = useMemo(() => {
    const map = new Map<string, MatrixItem>();
    matrix.forEach((m) => {
      map.set(`${m.subject_id}_${m.level_id}`, m);
    });
    return map;
  }, [matrix]);

  // 3. Filtered Matrix for Action Table
  const filteredMatrix = useMemo(() => {
    return matrix.filter((item) => {
      const matchesSearch =
        item.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.level_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.level_code.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (gapsOnly) {
        return (
          item.unanswered_problems_count > 0 ||
          (item.lessons_count === 0 && item.total_activity > 0) ||
          item.total_activity === 0
        );
      }

      return true;
    });
  }, [matrix, searchQuery, gapsOnly]);

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-xs transition-all">
      {/* Header & Tab Selector */}
      <div className="flex flex-col gap-4 border-b border-line/60 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Zap className="size-4" />
              </div>
              <h3 className="text-lg font-semibold text-ink">
                Curriculum Health & Action Center
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Intelligent triage across Subjects × Levels to identify content blindspots, unanswered bottlenecks, and coverage gaps.
            </p>
          </div>

          {/* Quick Health Summary Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {unansweredGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {unansweredGaps.length} Unanswered Bottlenecks
              </div>
            )}
            {zeroLessonGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-muted/30 px-3 py-1.5 text-xs font-medium text-ink-muted">
                <BookOpen className="size-3.5 text-primary" />
                {zeroLessonGaps.length} Missing Lessons
              </div>
            )}
            {dormantGaps.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-muted/20 px-3 py-1.5 text-xs font-medium text-ink-muted/80">
                <span>{dormantGaps.length} Dormant</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              {healthyCount} Active & Balanced
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="inline-flex rounded-xl border border-line bg-muted/30 p-1 text-xs font-medium shadow-2xs">
            <button
              onClick={() => setActiveTab("priority")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
                activeTab === "priority"
                  ? "bg-card text-ink font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Zap className="size-3.5 text-amber-500" />
              Priority Action Triage
              {unansweredGaps.length + zeroLessonGaps.length > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {unansweredGaps.length + zeroLessonGaps.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
                activeTab === "heatmap"
                  ? "bg-card text-ink font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Grid className="size-3.5 text-indigo-500" />
              Coverage Heatmap
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
                activeTab === "table"
                  ? "bg-card text-ink font-semibold shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <TableIcon className="size-3.5 text-sky-500" />
              Searchable Table
            </button>
          </div>

          {activeTab === "table" && (
            <button
              onClick={() => setGapsOnly(!gapsOnly)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                gapsOnly
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                  : "border-line bg-card text-ink-muted hover:text-ink"
              }`}
            >
              <Filter className="size-3" />
              {gapsOnly ? "Showing Gaps Only" : "Show Gaps Only"}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRIORITY ACTION TRIAGE                             */}
      {/* ========================================================= */}
      {activeTab === "priority" && (
        <div className="mt-6 flex flex-col gap-6">
          {unansweredGaps.length === 0 && zeroLessonGaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <h4 className="text-base font-semibold text-ink">
                Outstanding! No Critical Curriculum Gaps
              </h4>
              <p className="max-w-md text-xs text-ink-muted">
                All subject-level topics with activity have published lessons and answered challenges.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category A: Unanswered Challenge Bottlenecks */}
              <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-sm font-semibold text-ink">
                      Unanswered Problems ({unansweredGaps.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Students asked challenges in these topics, but no community or teacher solutions exist yet.
                </p>

                <div className="mt-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {unansweredGaps.length === 0 ? (
                    <div className="rounded-lg border border-line bg-card p-3 text-xs text-ink-muted text-center">
                      No unanswered challenges!
                    </div>
                  ) : (
                    unansweredGaps.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-line bg-card p-3 shadow-2xs hover:border-amber-500/50 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-ink">
                              {item.subject_name}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                              {item.level_code}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-muted">
                            <span>Total Problems: {item.problems_count}</span>
                            <span>•</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {item.unanswered_problems_count} unanswered
                            </span>
                          </div>
                        </div>

                        <Link
                          href="/admin/taxonomy"
                          className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
                        >
                          Taxonomy <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category B: Zero-Lesson Blindspots */}
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    <h4 className="text-sm font-semibold text-ink">
                      Active Topics with 0 Lessons ({zeroLessonGaps.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-ink-muted">
                    Curriculum Need
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Students are active in forum discussions and questions, but no official published lessons exist.
                </p>

                <div className="mt-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {zeroLessonGaps.length === 0 ? (
                    <div className="rounded-lg border border-line bg-muted/20 p-3 text-xs text-ink-muted text-center">
                      All active topics have published lessons!
                    </div>
                  ) : (
                    zeroLessonGaps.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-line bg-muted/10 p-3 shadow-2xs hover:border-primary/50 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-ink">
                              {item.subject_name}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                              {item.level_code}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-muted">
                            <span>
                              Student Activity:{" "}
                              <strong className="text-ink">
                                {item.total_activity}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-primary font-medium">
                              0 Lessons Published
                            </span>
                          </div>
                        </div>

                        <Link
                          href="/admin/resources"
                          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          Add Lesson <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: COVERAGE HEATMAP                                   */}
      {/* ========================================================= */}
      {activeTab === "heatmap" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>
              Click any cell to inspect detailed statistics and direct actions.
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded bg-muted/40 border border-line" />{" "}
                Dormant (0)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded bg-sky-500/20 border border-sky-500/40" />{" "}
                Low (1-5)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />{" "}
                Active (6+)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded bg-amber-500/40 border border-amber-500/60" />{" "}
                Unanswered
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-muted/30">
                  <th className="p-3 font-semibold text-ink sticky left-0 bg-card z-10">
                    Subject / Level
                  </th>
                  {levels.map((l) => (
                    <th
                      key={l.id}
                      className="p-3 text-center font-semibold text-ink min-w-[110px]"
                    >
                      <div>{l.name}</div>
                      <div className="text-[10px] font-normal text-ink-muted">
                        ({l.code})
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-medium text-ink bg-card sticky left-0 z-10 whitespace-nowrap border-r border-line/40">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-ink-muted font-normal">
                        ({s.code})
                      </div>
                    </td>
                    {levels.map((l) => {
                      const cell = matrixLookup.get(`${s.id}_${l.id}`);
                      const totalAct = cell?.total_activity ?? 0;
                      const hasUnanswered =
                        (cell?.unanswered_problems_count ?? 0) > 0;
                      const hasZeroLessons =
                        (cell?.lessons_count ?? 0) === 0 && totalAct > 0;

                      // Heatmap Cell Styling
                      let bgClass = "bg-muted/20 border-line/40 text-ink-muted";
                      if (hasUnanswered) {
                        bgClass =
                          "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-500/25";
                      } else if (totalAct >= 15) {
                        bgClass =
                          "bg-emerald-500/25 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/35";
                      } else if (totalAct >= 6) {
                        bgClass =
                          "bg-emerald-500/15 border-emerald-500/30 text-ink hover:bg-emerald-500/25";
                      } else if (totalAct > 0) {
                        bgClass =
                          "bg-sky-500/10 border-sky-500/20 text-ink hover:bg-sky-500/20";
                      }

                      return (
                        <td key={l.id} className="p-2 text-center">
                          <button
                            onClick={() => cell && setSelectedCell(cell)}
                            className={`w-full rounded-xl border p-2.5 text-center transition-all cursor-pointer ${bgClass}`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-[10px] opacity-75">Act:</span>
                              <strong>{totalAct}</strong>
                            </div>

                            {hasUnanswered ? (
                              <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="size-2.5" />
                                {cell?.unanswered_problems_count} Unans
                              </div>
                            ) : hasZeroLessons ? (
                              <div className="mt-1 text-[9px] opacity-80">
                                0 Lessons
                              </div>
                            ) : totalAct > 0 ? (
                              <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-2.5" /> Healthy
                              </div>
                            ) : (
                              <div className="mt-1 text-[9px] opacity-40">
                                Dormant
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SEARCHABLE ACTION TABLE                            */}
      {/* ========================================================= */}
      {activeTab === "table" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by subject or level..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-line bg-muted/40 pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-muted/40 border-b border-line">
                <tr>
                  <th className="p-3 font-semibold text-ink">Subject</th>
                  <th className="p-3 font-semibold text-ink">Level</th>
                  <th className="p-3 text-center font-semibold text-ink">
                    Lessons
                  </th>
                  <th className="p-3 text-center font-semibold text-ink">
                    Posts
                  </th>
                  <th className="p-3 text-center font-semibold text-ink">
                    Problems
                  </th>
                  <th className="p-3 text-center font-semibold text-ink">
                    Solutions
                  </th>
                  <th className="p-3 text-center font-semibold text-ink">
                    Mean Sols/Prob
                  </th>
                  <th className="p-3 text-center font-semibold text-ink">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-xs text-ink-muted"
                    >
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((item, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedCell(item)}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-medium text-ink">
                        {item.subject_name} ({item.subject_code})
                      </td>
                      <td className="p-3 text-ink-muted">
                        {item.level_name} ({item.level_code})
                      </td>
                      <td className="p-3 text-center font-medium text-ink">
                        {item.lessons_count}
                      </td>
                      <td className="p-3 text-center font-medium text-ink">
                        {item.posts_count}
                      </td>
                      <td className="p-3 text-center font-medium text-ink">
                        {item.problems_count}
                      </td>
                      <td className="p-3 text-center font-medium text-ink">
                        {item.solutions_count}
                      </td>
                      <td className="p-3 text-center font-semibold text-primary">
                        {item.avg_solutions_per_problem.toFixed(1)}x
                      </td>
                      <td className="p-3 text-center">
                        {item.unanswered_problems_count > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-3" />{" "}
                            {item.unanswered_problems_count} unanswered
                          </span>
                        ) : item.lessons_count === 0 && item.total_activity > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                            <BookOpen className="size-3" /> 0 Lessons
                          </span>
                        ) : item.total_activity > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" /> Healthy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] text-ink-muted">
                            Dormant
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE CELL DRILLDOWN MODAL                          */}
      {/* ========================================================= */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl">
            <button
              onClick={() => setSelectedCell(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted hover:bg-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-line/60 pb-3">
              <span className="text-lg font-bold text-ink">
                {selectedCell.subject_name}
              </span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {selectedCell.level_name} ({selectedCell.level_code})
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <BookOpen className="size-3.5 text-primary" /> Lessons
                </div>
                <div className="mt-1 text-xl font-bold text-ink">
                  {selectedCell.lessons_count}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <MessageSquare className="size-3.5 text-sky-500" /> Posts
                </div>
                <div className="mt-1 text-xl font-bold text-ink">
                  {selectedCell.posts_count}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <HelpCircle className="size-3.5 text-amber-500" /> Problems
                </div>
                <div className="mt-1 text-xl font-bold text-ink">
                  {selectedCell.problems_count}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <CheckCheck className="size-3.5 text-emerald-500" /> Solutions
                </div>
                <div className="mt-1 text-xl font-bold text-ink">
                  {selectedCell.solutions_count}
                </div>
              </div>
            </div>

            {/* Health & Gaps Alert */}
            <div className="mt-4 rounded-xl border border-line bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Mean Solutions/Prob:</span>
                <span className="font-semibold text-primary">
                  {selectedCell.avg_solutions_per_problem.toFixed(1)}x
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Unanswered Bottleneck:</span>
                <span
                  className={`font-semibold ${
                    selectedCell.unanswered_problems_count > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {selectedCell.unanswered_problems_count > 0
                    ? `${selectedCell.unanswered_problems_count} Unanswered`
                    : "All Answered"}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 flex gap-2">
              <Link
                href="/admin/taxonomy"
                className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                Taxonomy & Rules
              </Link>
              <Link
                href="/admin/resources"
                className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-center text-xs font-semibold text-ink hover:bg-muted"
              >
                Manage Lessons
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
