"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useTrainTree } from "@/hooks/use-train";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DualPdfViewer } from "@/components/features/train/dual-pdf-viewer";
import {
  Loader2,
  Play,
  FileText,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Search,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resource, Level, Subject, TrainTreePaper } from "@/types";

export default function TrainPage() {
  const { getToken } = useAuth();

  // 1. Level & Subject Selection State (like in Admin Add paper panel)
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // 2. Folder search filter
  const [folderSearch, setFolderSearch] = useState<string>("");

  // 3. Active preview slots for Left and Right (undefined = uninitialized, null = closed, string = active)
  const [leftPaperId, setLeftPaperId] = useState<string | null | undefined>(undefined);
  const [rightPaperId, setRightPaperId] = useState<string | null>(null);

  // 4. Year folders expand/collapse state
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: prev[year] === undefined ? false : !prev[year],
    }));
  };

  // Fetch Levels & Subjects dropdown data
  const { data: levels = [], isLoading: isLoadingLevels } = useQuery<Level[]>({
    queryKey: ["levels"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data?: Level[] } | Level[]>("/levels/", token as string);
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data?: Subject[] } | Subject[]>("/subjects/", token as string);
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // Fetch curriculum tree when Level & Subject are selected
  const { data: treeData, isLoading: isTreeLoading } = useTrainTree(
    selectedSubject || null,
    selectedLevel || null
  );

  // Fetch all resources for selected Level & Subject to support PDF preview & direct selection
  const { data: resources = [], isLoading: isLoadingResources } = useQuery<Resource[]>({
    queryKey: ["trainResources", selectedLevel, selectedSubject],
    queryFn: async () => {
      if (!selectedLevel || !selectedSubject) return [];
      const token = await getToken();
      const params = new URLSearchParams({
        level: selectedLevel,
        subject: selectedSubject,
        resource_type: "PAST_PAPER",
        page_size: "100",
      });
      const res = await apiFetch<{ results?: Resource[]; data?: Resource[] } | Resource[]>(
        `/resources/files/?${params.toString()}`,
        token as string
      );
      if (Array.isArray(res)) return res;
      return res?.data || res?.results || [];
    },
    enabled: !!selectedLevel && !!selectedSubject,
  });

  // Filter tree papers by search query
  const filteredYears = useMemo(() => {
    if (!treeData?.years) return [];
    const q = folderSearch.toLowerCase().trim();
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
  }, [treeData, folderSearch]);

  // Default Left paper to first QP when resources are loaded and user hasn't toggled yet
  useEffect(() => {
    if (resources.length > 0 && leftPaperId === undefined) {
      const firstQP = resources.find((r) => r.paper_type === "QP") || resources[0];
      if (firstQP) {
        setLeftPaperId(firstQP.id);
      }
    }
  }, [resources, leftPaperId]);

  // Active selected paper details
  const leftPaper = useMemo(() => {
    if (!leftPaperId) return null;
    return resources.find((r) => r.id === leftPaperId) || null;
  }, [leftPaperId, resources]);

  const rightPaper = useMemo(() => {
    if (!rightPaperId) return null;
    return resources.find((r) => r.id === rightPaperId) || null;
  }, [rightPaperId, resources]);

  const activePaper = leftPaper || rightPaper || null;

  const handleToggleLeft = (p: TrainTreePaper) => {
    if (leftPaperId === p.id) {
      setLeftPaperId(null);
    } else {
      setLeftPaperId(p.id);
      if (rightPaperId === p.id) {
        setRightPaperId(null);
      }
    }
  };

  const handleToggleRight = (p: TrainTreePaper) => {
    if (rightPaperId === p.id) {
      setRightPaperId(null);
    } else {
      setRightPaperId(p.id);
      if (leftPaperId === p.id) {
        setLeftPaperId(null);
      }
    }
  };

  const activeLevelName = levels.find((l) => l.id === selectedLevel)?.name;
  const activeSubjectName = subjects.find((s) => s.id === selectedSubject)?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-0 -mt-3 sm:px-6">
      <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left Sidebar: Option to choose Level & Subject, then opens Folder Structure */}
        <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-2xs">
            {/* Level & Subject Selector Header */}
            <div className="p-4 border-b border-line bg-surface/50 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <GraduationCap className="size-4 text-primary" />
                Select Curriculum
              </h3>

              {/* 1. Level Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                  1. Select Level
                </label>
                <select
                  disabled={isLoadingLevels}
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setLeftPaperId(undefined);
                    setRightPaperId(null);
                  }}
                  className="w-full rounded-lg border border-line px-3 py-2 bg-card text-sm text-ink focus:outline-primary transition-colors disabled:opacity-50"
                >
                  <option value="">-- Choose Level --</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.code ? `(${l.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Subject Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                  2. Select Subject
                </label>
                <select
                  disabled={isLoadingSubjects}
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setLeftPaperId(undefined);
                    setRightPaperId(null);
                  }}
                  className="w-full rounded-lg border border-line px-3 py-2 bg-card text-sm text-ink focus:outline-primary transition-colors disabled:opacity-50"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Folder Structure (opens on the side once Level & Subject are selected) */}
            {!selectedLevel || !selectedSubject ? (
              <div className="p-8 text-center text-ink-muted flex flex-col items-center gap-2">
                <Folder className="size-8 text-ink-muted/40" />
                <p className="text-xs font-semibold text-ink">Folder Structure</p>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Select a Level and Subject above to open the past paper folders.
                </p>
              </div>
            ) : isTreeLoading || isLoadingResources ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-ink-muted">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs font-medium">Loading folders...</span>
              </div>
            ) : (
              <div className="p-3 flex flex-col gap-2 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
                {/* Search within tree */}
                <div className="relative mb-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search folder papers..."
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-line bg-surface text-xs focus:outline-primary"
                  />
                </div>

                {filteredYears.length === 0 ? (
                  <p className="text-xs text-ink-muted text-center py-6 italic">
                    No past papers found for this curriculum.
                  </p>
                ) : (
                  filteredYears.map((yearGroup) => {
                    const isYearExpanded = expandedYears[yearGroup.year] !== false; // expanded by default
                    return (
                      <div
                        key={yearGroup.year}
                        className="rounded-xl border border-line/60 overflow-hidden bg-surface/30"
                      >
                        {/* Year Header */}
                        <button
                          type="button"
                          onClick={() => toggleYear(yearGroup.year)}
                          className="w-full flex items-center justify-between p-2.5 hover:bg-muted/40 text-left transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2">
                            {isYearExpanded ? (
                              <FolderOpen className="size-4 text-primary" />
                            ) : (
                              <Folder className="size-4 text-primary" />
                            )}
                            <span className="text-xs font-bold text-ink">
                              {yearGroup.year} Past Papers
                            </span>
                          </div>
                          {isYearExpanded ? (
                            <ChevronDown className="size-3.5 text-ink-muted" />
                          ) : (
                            <ChevronRight className="size-3.5 text-ink-muted" />
                          )}
                        </button>

                        {/* Inside Year: Sessions */}
                        {isYearExpanded && (
                          <div className="pl-3 pr-2 pb-2 pt-1 flex flex-col gap-1.5 border-t border-line/40">
                            {yearGroup.sessions.map((sessionGroup) => (
                              <div key={sessionGroup.session} className="flex flex-col gap-1">
                                <span className="text-[11px] font-semibold text-ink-muted px-1">
                                  {sessionGroup.session_label}
                                </span>

                                {/* Papers in session */}
                                <div className="flex flex-col gap-1">
                                  {sessionGroup.papers.map((p) => {
                                    const isLeft = leftPaperId === p.id;
                                    const isRight = rightPaperId === p.id;
                                    const isMS = p.paper_type === "MS" || p.file_name.toLowerCase().includes("ms");

                                    return (
                                      <div
                                        key={p.id}
                                        onClick={() => handleToggleLeft(p)}
                                        className={cn(
                                          "flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer group border",
                                          isLeft
                                            ? "bg-primary/10 border-primary/30 text-ink font-semibold"
                                            : isRight
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-ink font-semibold"
                                            : "hover:bg-muted text-ink border-transparent"
                                        )}
                                      >
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
                                          <span className="truncate text-xs" title={p.file_name}>
                                            {p.label}
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
                                            {p.paper_type || (isMS ? "MS" : "QP")}
                                          </Badge>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {/* [ L ] Toggle Button */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleLeft(p);
                                            }}
                                            className={cn(
                                              "h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer",
                                              isLeft
                                                ? "bg-primary text-primary-foreground shadow-xs border border-primary ring-1 ring-primary/40"
                                                : "border border-line/80 bg-surface/80 text-ink-muted hover:text-ink hover:bg-muted"
                                            )}
                                            title={
                                              isLeft
                                                ? "Close Left preview"
                                                : "Preview in Left panel (L)"
                                            }
                                          >
                                            L
                                          </button>

                                          {/* [ R ] Toggle Button */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleRight(p);
                                            }}
                                            className={cn(
                                              "h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer",
                                              isRight
                                                ? "bg-emerald-600 text-white shadow-xs border border-emerald-600 ring-1 ring-emerald-500/40"
                                                : "border border-line/80 bg-surface/80 text-ink-muted hover:text-ink hover:bg-muted"
                                            )}
                                            title={
                                              isRight
                                                ? "Close Right preview"
                                                : "Preview in Right panel (R)"
                                            }
                                          >
                                            R
                                          </button>

                                          {/* Practice Workspace Link */}
                                          <Link
                                            href={`/train/${p.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 transition-opacity ml-1 flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                                            title="Open in Train Practice Workspace"
                                          >
                                            <span>Train</span>
                                            <ArrowRight className="size-2.5" />
                                          </Link>
                                        </div>
                                      </div>
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
            )}
          </div>
        </aside>

        {/* Right Main Practice Canvas / Preview Area */}
        <main className="min-w-0 flex-1 flex flex-col gap-4">
          {!selectedLevel || !selectedSubject ? (
            <div className="rounded-2xl border border-line border-dashed bg-card p-16 text-center text-ink-muted flex flex-col items-center justify-center gap-3 h-[450px]">
              <GraduationCap className="size-12 text-ink-muted/30 stroke-1" />
              <h3 className="text-base font-semibold text-ink">Exam Practice Workspace</h3>
              <p className="text-xs text-ink-muted max-w-sm">
                Select a Level and Subject from the sidebar to open the folder structure and start
                practicing past papers.
              </p>
            </div>
          ) : !activePaper ? (
            <div className="rounded-2xl border border-line border-dashed bg-card p-16 text-center text-ink-muted flex flex-col items-center justify-center gap-2 h-[450px]">
              <BookOpen className="size-10 text-ink-muted/30 stroke-1" />
              <p className="text-sm font-semibold text-ink">No Documents Open in Workspace</p>
              <p className="text-xs text-ink-muted max-w-sm text-center leading-relaxed">
                Use the <span className="font-semibold text-primary">[L]</span> and <span className="font-semibold text-emerald-600 dark:text-emerald-400">[R]</span> toggle buttons in the folder structure to open papers.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Active Paper Action Header */}
              <div className="rounded-2xl border border-line bg-card p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink text-base truncate">
                      {leftPaper && rightPaper
                        ? `${leftPaper.file_name} & ${rightPaper.file_name}`
                        : activePaper.file_name}
                    </span>
                    {leftPaper && rightPaper ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase border-primary/40 text-primary bg-primary/10"
                      >
                        Dual View Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          activePaper.paper_type === "MS"
                            ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                        )}
                      >
                        {activePaper.paper_type === "MS" ? "Mark Scheme" : "Question Paper"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    {activeLevelName && <span>{activeLevelName}</span>}
                    {activeSubjectName && <span>• {activeSubjectName}</span>}
                    {activePaper.year && <span>• {activePaper.year}</span>}
                    {activePaper.session && <span>• {activePaper.session}</span>}
                  </div>
                </div>

                {/* Primary Train Launch CTA */}
                <Link
                  href={`/train/${activePaper.id}`}
                  className={buttonVariants({
                    variant: "default",
                    size: "default",
                    className:
                      "h-10 px-4 gap-2 font-semibold bg-primary text-primary-foreground shadow-xs hover:opacity-90 transition-opacity shrink-0",
                  })}
                >
                  <Play className="size-4 fill-current" />
                  <span>Start Practice Session ↗</span>
                </Link>
              </div>

              {/* In-Place Dual / Single PDF Preview Canvas */}
              <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-xs h-[calc(100vh-210px)] flex flex-col">
                <DualPdfViewer
                  leftResource={leftPaper}
                  rightResource={rightPaper}
                  onCloseLeft={leftPaper ? () => setLeftPaperId(null) : undefined}
                  onCloseRight={rightPaper ? () => setRightPaperId(null) : undefined}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
