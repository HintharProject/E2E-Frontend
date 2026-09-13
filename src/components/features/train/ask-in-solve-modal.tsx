"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Resource, Problem } from "@/types";
import { usePaperProblems } from "@/hooks/use-problems";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  ExternalLink,
  PlusCircle,
  Loader2,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AskInSolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePaper?: Resource | null;
  leftPaper?: Resource | null;
  rightPaper?: Resource | null;
  paper?: Resource; // fallback for backwards compatibility
}

export function AskInSolveModal({
  isOpen,
  onClose,
  activePaper,
  leftPaper,
  rightPaper,
  paper,
}: AskInSolveModalProps) {
  const [filterQuery, setFilterQuery] = useState("");

  // Resolve all actively loaded papers in the workspace
  const availablePapers = useMemo(() => {
    const list: Resource[] = [];
    if (leftPaper) list.push(leftPaper);
    if (rightPaper && rightPaper.id !== leftPaper?.id) list.push(rightPaper);
    if (list.length === 0 && (activePaper || paper)) {
      list.push((activePaper || paper)!);
    }
    return list;
  }, [leftPaper, rightPaper, activePaper, paper]);

  // Default to activePaper, or Question Paper (QP), or first available paper
  const defaultPaperId = useMemo(() => {
    if (activePaper) return activePaper.id;
    const qp = availablePapers.find((p) => p.paper_type === "QP");
    if (qp) return qp.id;
    return availablePapers[0]?.id || "";
  }, [activePaper, availablePapers]);

  const [selectedPaperId, setSelectedPaperId] = useState<string>(defaultPaperId);

  // Sync selectedPaperId when modal opens or active paper changes
  useEffect(() => {
    if (isOpen) {
      if (activePaper) {
        setSelectedPaperId(activePaper.id);
      } else if (availablePapers.length > 0) {
        const qp = availablePapers.find((p) => p.paper_type === "QP");
        setSelectedPaperId(qp ? qp.id : availablePapers[0].id);
      }
    }
  }, [isOpen, activePaper, availablePapers]);

  // Current active paper within modal
  const currentPaper = useMemo(() => {
    return (
      availablePapers.find((p) => p.id === selectedPaperId) ||
      availablePapers[0] ||
      activePaper ||
      paper
    );
  }, [availablePapers, selectedPaperId, activePaper, paper]);

  // Query problems for the currently selected paper
  const { data: problems = [], isLoading } = usePaperProblems(
    isOpen && currentPaper ? currentPaper.id : undefined
  );

  // In-memory filter for quick keyword/question lookup
  const filteredProblems = useMemo(() => {
    if (!filterQuery.trim()) return problems;
    const q = filterQuery.toLowerCase().trim();
    return problems.filter((prob: Problem) => {
      const qNum = (prob.question_number || "").toLowerCase();
      const title = (prob.title || "").toLowerCase();
      const body = (prob.body || "").toLowerCase();
      return qNum.includes(q) || title.includes(q) || body.includes(q);
    });
  }, [problems, filterQuery]);

  const levelId =
    currentPaper?.level_details?.id ||
    (typeof currentPaper?.level === "string" ? currentPaper.level : (currentPaper?.level as any)?.id) ||
    "";
  const subjectId =
    currentPaper?.subject_details?.id ||
    (typeof currentPaper?.subject === "string" ? currentPaper.subject : (currentPaper?.subject as any)?.id) ||
    "";

  const postProblemUrl = `/problems/new?origin=PAST_PAPER&level=${encodeURIComponent(
    levelId
  )}&subject=${encodeURIComponent(subjectId)}&resource=${encodeURIComponent(currentPaper?.id || "")}`;

  const handlePostQuestion = () => {
    window.open(postProblemUrl, "_blank");
    onClose();
  };

  const formatSession = (s?: string | null) => {
    if (s === "MAY_JUNE") return "May / June";
    if (s === "OCT_NOV") return "Oct / Nov";
    if (s === "JANUARY") return "January";
    return s || "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[94vw] h-[86vh] max-h-[900px] p-0 overflow-hidden rounded-2xl flex flex-col shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-3.5 border-b border-line bg-surface/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <MessageSquare className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold text-ink truncate">
                  Solve! Community Discussions
                </DialogTitle>
                <DialogDescription className="text-xs text-ink-muted truncate mt-0.5">
                  Browse step-by-step solutions created by peers for this exam paper, or ask the community.
                </DialogDescription>
              </div>
            </div>

            {/* Post Question CTA in header */}
            <Button
              size="sm"
              variant="default"
              onClick={handlePostQuestion}
              className="h-8.5 px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shrink-0 shadow-2xs cursor-pointer"
              title="Post a new question from this paper to Solve!"
            >
              <PlusCircle className="size-3.5" />
              <span>Post Question</span>
            </Button>
          </div>

          {/* Dual / Multi Paper Switcher Tabs (when more than 1 paper is loaded in workspace) */}
          {availablePapers.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 mt-3 rounded-xl bg-muted/40 border border-line/80 flex-wrap">
              <span className="text-[11px] font-semibold text-ink-muted px-2 shrink-0 flex items-center gap-1">
                <Layers className="size-3" />
                <span>Active Papers:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availablePapers.map((p) => {
                  const isSelected = p.id === currentPaper?.id;
                  const isLeft = p.id === leftPaper?.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaperId(p.id);
                        setFilterQuery("");
                      }}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium border",
                        isSelected
                          ? "bg-card text-ink shadow-xs border-primary/40 font-semibold ring-1 ring-primary/20"
                          : "border-transparent text-ink-muted hover:text-ink hover:bg-card/50"
                      )}
                      title={`Switch to ${p.file_name}`}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1 rounded leading-none py-0.5",
                          isLeft
                            ? "bg-primary text-primary-foreground"
                            : "bg-emerald-600 text-white"
                        )}
                      >
                        {isLeft ? "L" : "R"}
                      </span>
                      <span>
                        {p.year ? `${p.year} ` : ""}
                        {p.session ? `${formatSession(p.session)} ` : ""}
                        {p.paper_code ? `· P${p.paper_code} ` : ""}
                        {p.paper_type ? `(${p.paper_type})` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paper Context Ribbon */}
          {currentPaper && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-line/60 text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="font-semibold text-ink truncate max-w-[320px]">
                  {currentPaper.subject_details?.name || currentPaper.file_name}
                </span>
                <div className="flex items-center gap-1 text-ink-muted flex-wrap">
                  {currentPaper.year && <span>• {currentPaper.year}</span>}
                  {currentPaper.session && <span>• {formatSession(currentPaper.session)}</span>}
                  {currentPaper.paper_code && <span>• Paper {currentPaper.paper_code}</span>}
                  {currentPaper.paper_type && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold py-0 h-4.5 ${
                        currentPaper.paper_type === "QP"
                          ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                          : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                      }`}
                    >
                      {currentPaper.paper_type === "QP" ? "Question Paper" : "Mark Scheme"}
                    </Badge>
                  )}
                </div>
              </div>

              <span className="text-[11px] text-ink-muted truncate max-w-[240px] hidden md:inline">
                {currentPaper.file_name}
              </span>
            </div>
          )}

          {/* Quick Filter Search */}
          {problems.length > 0 && (
            <div className="relative mt-2.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted" />
              <Input
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter questions by number (e.g. Q4 or 2(b)) or keyword..."
                className="h-8.5 pl-9 text-xs bg-card border-line"
              />
            </div>
          )}
        </DialogHeader>

        {/* Body: Problem List / Loading / Empty State */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-muted">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-xs font-medium">
                Checking community solutions for {currentPaper?.file_name || "this paper"}...
              </p>
            </div>
          ) : problems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-muted/20 p-10 text-center flex flex-col items-center justify-center gap-3.5 my-4">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="size-6" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-base font-bold text-ink">No questions posted yet for this paper</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Be the first student to ask for help on this paper! Posting links directly to this curated past paper with zero upload overhead.
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={handlePostQuestion}
                className="mt-2 h-9 px-4 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer"
              >
                <PlusCircle className="size-4" />
                <span>Post Question to Solve!</span>
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="rounded-xl border border-line bg-muted/10 p-10 text-center space-y-2.5 my-4">
              <p className="text-xs font-semibold text-ink">No questions match &ldquo;{filterQuery}&rdquo;</p>
              <p className="text-[11px] text-ink-muted">
                Try searching a different question number or clear the search filter.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterQuery("")}
                className="h-7.5 text-xs px-3 mt-2"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-muted px-1">
                <span>
                  Found <strong className="text-ink font-semibold">{filteredProblems.length}</strong>{" "}
                  {filteredProblems.length === 1 ? "problem discussion" : "problem discussions"}
                </span>
                <span className="text-[11px] hidden sm:inline">Click &ldquo;View in Solve!&rdquo; to review step-by-step solutions</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {filteredProblems.map((prob: Problem) => {
                  const solutionCount = prob.solution_count ?? 0;
                  const isFinal = prob.status === "FINAL";
                  const isSolved = prob.status === "SOLVED";

                  return (
                    <div
                      key={prob.id}
                      className="p-4 rounded-xl border border-line bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Question Number Badge */}
                        <div className="shrink-0 flex items-center justify-center min-w-11 px-2.5 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold text-center">
                          {prob.question_number ? (
                            <span>Q{prob.question_number.replace(/^[Qq]/, "")}</span>
                          ) : (
                            <span className="text-[10px]">General</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-ink line-clamp-1 group-hover:text-primary transition-colors">
                              {prob.title}
                            </span>

                            {/* Status Badge */}
                            {isFinal ? (
                              <Badge className="text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-600 text-white gap-1 py-0 h-4.5">
                                <Lock className="size-2.5" /> Consensus Verified
                              </Badge>
                            ) : isSolved ? (
                              <Badge className="text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-600 text-white gap-1 py-0 h-4.5">
                                <CheckCircle2 className="size-2.5" /> Solved
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 py-0 h-4.5"
                              >
                                Open
                              </Badge>
                            )}
                          </div>

                          {prob.body && (
                            <p className="text-[11px] sm:text-xs text-ink-muted line-clamp-2 mt-1 leading-relaxed">
                              {prob.body}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-2 flex-wrap">
                            {prob.author_details && (
                              <span>
                                Asked by{" "}
                                <strong className="text-ink font-medium">
                                  {prob.author_details.display_name}
                                </strong>
                              </span>
                            )}
                            <span>•</span>
                            <span className="text-primary font-semibold">
                              {solutionCount} {solutionCount === 1 ? "solution" : "solutions"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Button */}
                      <div className="shrink-0 sm:self-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(`/problems/${prob.id}`, "_blank")}
                          className="h-8.5 px-3.5 text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors w-full sm:w-auto cursor-pointer"
                        >
                          <span>View in Solve!</span>
                          <ExternalLink className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Bottom CTA to Post a New Question */}
        <div className="p-4 sm:px-6 border-t border-line bg-surface/80 flex items-center justify-between gap-3">
          <p className="text-[11px] text-ink-muted hidden sm:block">
            Need help on a different question from this paper?
          </p>
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8.5 px-3.5 text-xs flex-1 sm:flex-initial cursor-pointer"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePostQuestion}
              className="h-8.5 px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground flex-1 sm:flex-initial cursor-pointer"
            >
              <PlusCircle className="size-3.5" />
              <span>Post Question to Solve!</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
