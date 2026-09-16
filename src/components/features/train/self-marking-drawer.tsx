"use client";

import React, { useState, useMemo } from "react";
import { Resource, PaperAttemptDetail, QuestionMarkInput } from "@/types";
import { useTrainTimer, useCreateAttempt } from "@/hooks/use-train";
import { useTags } from "@/hooks/use-metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  X,
  Plus,
  Trash2,
  Award,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionRowState {
  id: string;
  question_number: string;
  score_awarded: string;
  max_score: string;
  student_notes: string;
  subtopic_tag: string | null;
}

interface SelfMarkingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Resource;
  timer: ReturnType<typeof useTrainTimer>;
  onAttemptCompleted?: (attempt: PaperAttemptDetail) => void;
}

export function computeGrade(percentage: number): {
  grade: string;
  color: string;
  bg: string;
} {
  if (percentage >= 85) {
    return {
      grade: "Grade A*",
      color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/50",
      bg: "bg-emerald-500/10",
    };
  }
  if (percentage >= 70) {
    return {
      grade: "Grade A",
      color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/50",
      bg: "bg-emerald-500/10",
    };
  }
  if (percentage >= 60) {
    return {
      grade: "Grade B",
      color: "text-blue-600 dark:text-blue-400 border-blue-500/50",
      bg: "bg-blue-500/10",
    };
  }
  if (percentage >= 50) {
    return {
      grade: "Grade C",
      color: "text-amber-600 dark:text-amber-400 border-amber-500/50",
      bg: "bg-amber-500/10",
    };
  }
  if (percentage >= 40) {
    return {
      grade: "Grade D",
      color: "text-orange-600 dark:text-orange-400 border-orange-500/50",
      bg: "bg-orange-500/10",
    };
  }
  if (percentage >= 30) {
    return {
      grade: "Grade E",
      color: "text-orange-600 dark:text-orange-400 border-orange-500/50",
      bg: "bg-orange-500/10",
    };
  }
  return {
    grade: "Grade U",
    color: "text-red-600 dark:text-red-400 border-red-500/50",
    bg: "bg-red-500/10",
  };
}

export function SelfMarkingDrawer({
  isOpen,
  onClose,
  paper,
  timer,
  onAttemptCompleted,
}: SelfMarkingDrawerProps) {
  const { data: tags = [] } = useTags();
  const createAttemptMutation = useCreateAttempt();

  // Starter 5 questions Q1 to Q5
  const [rows, setRows] = useState<QuestionRowState[]>([
    { id: "1", question_number: "Q1", score_awarded: "", max_score: "10.0", student_notes: "", subtopic_tag: null },
    { id: "2", question_number: "Q2", score_awarded: "", max_score: "10.0", student_notes: "", subtopic_tag: null },
    { id: "3", question_number: "Q3", score_awarded: "", max_score: "10.0", student_notes: "", subtopic_tag: null },
    { id: "4", question_number: "Q4", score_awarded: "", max_score: "10.0", student_notes: "", subtopic_tag: null },
    { id: "5", question_number: "Q5", score_awarded: "", max_score: "10.0", student_notes: "", subtopic_tag: null },
  ]);

  // Submission result state (when saved)
  const [completedAttempt, setCompletedAttempt] = useState<PaperAttemptDetail | null>(null);

  // Add question row
  const handleAddRow = () => {
    const nextIdx = rows.length + 1;
    setRows((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        question_number: `Q${nextIdx}`,
        score_awarded: "",
        max_score: "10.0",
        student_notes: "",
        subtopic_tag: null,
      },
    ]);
  };

  // Remove question row
  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      toast.error("Practice session must contain at least one question.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Update question row fields
  const handleUpdateRow = (id: string, updates: Partial<QuestionRowState>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  // Aggregates calculation
  const { totalScore, maxScore, percentage, gradeInfo } = useMemo(() => {
    let tScore = 0;
    let mScore = 0;

    for (const r of rows) {
      const s = parseFloat(r.score_awarded);
      const m = parseFloat(r.max_score);
      if (!isNaN(s)) tScore += s;
      if (!isNaN(m) && m > 0) mScore += m;
    }

    const pct = mScore > 0 ? (tScore / mScore) * 100 : 0;
    const roundedPct = Math.round(pct * 100) / 100;
    const gInfo = computeGrade(roundedPct);

    return {
      totalScore: Math.round(tScore * 100) / 100,
      maxScore: Math.round(mScore * 100) / 100,
      percentage: roundedPct,
      gradeInfo: gInfo,
    };
  }, [rows]);

  // Submit practice attempt
  const handleSubmit = async () => {
    // Validate rows
    const formattedMarks: QuestionMarkInput[] = [];

    for (const r of rows) {
      const qNum = r.question_number.trim();
      if (!qNum) {
        toast.error("All questions must have a question label (e.g. Q1, Q3(b)).");
        return;
      }

      const scoreNum = parseFloat(r.score_awarded);
      const maxNum = parseFloat(r.max_score);

      if (isNaN(scoreNum) || scoreNum < 0) {
        toast.error(`Please enter a valid non-negative mark for ${qNum}.`);
        return;
      }
      if (isNaN(maxNum) || maxNum <= 0) {
        toast.error(`Please enter a valid positive max mark for ${qNum}.`);
        return;
      }
      if (scoreNum > maxNum) {
        toast.error(`Marks awarded for ${qNum} cannot exceed the question's maximum (${maxNum}).`);
        return;
      }

      formattedMarks.push({
        question_number: qNum,
        score_awarded: scoreNum,
        max_score: maxNum,
        student_notes: r.student_notes.trim(),
        subtopic_tag: r.subtopic_tag || null,
      });
    }

    try {
      const attempt = await createAttemptMutation.mutateAsync({
        resource_id: paper.id,
        mode: timer.mode,
        target_duration_seconds: timer.targetDurationSeconds,
        time_spent_seconds: timer.elapsedSeconds,
        is_completed: true,
        marks: formattedMarks,
      });

      setCompletedAttempt(attempt);
      toast.success("Practice run evaluated and saved to your profile!");
      if (onAttemptCompleted) {
        onAttemptCompleted(attempt);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record practice attempt.";
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Container */}
      <div className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-lg bg-card border-l border-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
        {/* Header */}
        <div className="p-4 border-b border-line bg-surface flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Award className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-ink truncate">Self-Marking Engine</h2>
              <p className="text-xs text-ink-muted truncate">
                {paper.year} {paper.session} · Paper {paper.paper_code || "QP"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Close Self-Marking Drawer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Evaluation Celebration / Result View */}
        {completedAttempt ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-5">
            <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Sparkles className="size-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Practice Session Evaluated!
              </span>
              <h3 className="text-2xl font-black font-display text-ink">
                {completedAttempt.total_score} / {completedAttempt.max_score} marks
              </h3>
              <p className="text-sm text-ink-muted">
                Completed in {Math.floor(completedAttempt.time_spent_seconds / 60)} minutes ·{" "}
                <span className="font-semibold text-ink">{completedAttempt.percentage}%</span>
              </p>
            </div>

            <Badge
              variant="outline"
              className={cn("px-4 py-1.5 text-base font-bold rounded-xl border", gradeInfo.color, gradeInfo.bg)}
            >
              Projected {completedAttempt.projected_grade || gradeInfo.grade}
            </Badge>

            {/* Weak Topics Diagnostics */}
            {completedAttempt.weak_topics && completedAttempt.weak_topics.length > 0 && (
              <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <AlertTriangle className="size-4" />
                  <span>Identified Weak Topics (&lt; 50% accuracy)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completedAttempt.weak_topics.map((t) => (
                    <Badge
                      key={t.tag_id}
                      variant="outline"
                      className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs"
                    >
                      {t.tag_name} ({t.accuracy}%)
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-ink-muted">
                  These topics have been flagged to guide your future revision in Solve!
                </p>
              </div>
            )}

            <div className="w-full pt-4 flex flex-col gap-2">
              <Button
                variant="default"
                className="w-full bg-primary text-primary-foreground font-semibold"
                onClick={() => setCompletedAttempt(null)}
              >
                Review Question Scores
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Done & Close
              </Button>
            </div>
          </div>
        ) : (
          /* Question By Question Scoring Form */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="rounded-xl border border-line bg-surface/50 p-3 text-xs text-ink-muted leading-relaxed">
                Review your answers against the official Mark Scheme in Dual View. Enter your
                earned marks below (half-marks like <code>7.5</code> supported).
              </div>

              {/* Rows List */}
              <div className="space-y-2.5">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="p-3 rounded-xl border border-line bg-card space-y-2 transition-shadow shadow-2xs hover:border-line/80"
                  >
                    <div className="flex items-center gap-2">
                      {/* Question label input */}
                      <Input
                        value={row.question_number}
                        onChange={(e) =>
                          handleUpdateRow(row.id, { question_number: e.target.value })
                        }
                        placeholder="Q#"
                        className="w-20 h-8 text-xs font-bold text-ink bg-surface border-line"
                      />

                      {/* Score awarded */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={row.score_awarded}
                          onChange={(e) =>
                            handleUpdateRow(row.id, { score_awarded: e.target.value })
                          }
                          placeholder="Score"
                          className="h-8 text-xs font-mono text-ink bg-surface border-line"
                        />
                        <span className="text-xs text-ink-muted font-mono">/</span>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={row.max_score}
                          onChange={(e) =>
                            handleUpdateRow(row.id, { max_score: e.target.value })
                          }
                          placeholder="Max"
                          className="h-8 text-xs font-mono text-ink bg-surface border-line"
                        />
                        <span className="text-[11px] text-ink-muted hidden sm:inline">marks</span>
                      </div>

                      {/* Delete row */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1.5 text-ink-muted hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        title="Remove question"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Subtopic Tag & Notes Row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-line/40">
                      {/* Topic Selector */}
                      <select
                        value={row.subtopic_tag || ""}
                        onChange={(e) =>
                          handleUpdateRow(row.id, {
                            subtopic_tag: e.target.value || null,
                          })
                        }
                        className="h-7 px-2 text-[11px] rounded-lg border border-line bg-surface text-ink-muted focus:text-ink focus:outline-none w-1/2 truncate cursor-pointer"
                      >
                        <option value="">Tag subtopic (optional)...</option>
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      {/* Notes Input */}
                      <Input
                        value={row.student_notes}
                        onChange={(e) =>
                          handleUpdateRow(row.id, { student_notes: e.target.value })
                        }
                        placeholder="Notes (e.g. arithmetic slip)..."
                        className="h-7 text-[11px] flex-1 bg-surface border-line placeholder:text-ink-muted"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="w-full h-8 text-xs font-semibold gap-1.5 border-dashed border-line text-ink-muted hover:text-ink"
              >
                <Plus className="size-3.5" />
                <span>Add Question Row</span>
              </Button>
            </div>

            {/* Sticky Score Summary & Submit Footer */}
            <div className="p-4 border-t border-line bg-surface/95 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-ink-muted">Raw Total: </span>
                  <span className="font-bold text-ink text-sm font-mono">
                    {totalScore} / {maxScore}
                  </span>
                  <span className="text-ink-muted ml-1.5">({percentage}%)</span>
                </div>

                <Badge
                  variant="outline"
                  className={cn("px-2.5 py-0.5 text-xs font-bold border", gradeInfo.color, gradeInfo.bg)}
                >
                  {gradeInfo.grade}
                </Badge>
              </div>

              <Button
                variant="default"
                size="default"
                disabled={createAttemptMutation.isPending}
                onClick={handleSubmit}
                className="w-full h-9 text-xs font-semibold gap-2 bg-primary text-primary-foreground shadow-sm"
              >
                {createAttemptMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Evaluating Practice Run...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Save & Complete Practice Run</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
