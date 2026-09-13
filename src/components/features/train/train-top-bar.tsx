"use client";

import React from "react";
import Link from "next/link";
import { Resource } from "@/types";
import { useTrainTimer } from "@/hooks/use-train";
import { TimerWidget } from "./timer-widget";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Columns2,
  Square,
  MessageSquare,
  PenTool,
  CheckSquare,
  PanelLeft,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isAdminOrSuperAdmin } from "@/types/user";

interface TrainTopBarProps {
  paper: Resource;
  leftPaper?: Resource | null;
  rightPaper?: Resource | null;
  onCloseLeft?: () => void;
  onCloseRight?: () => void;
  timer: ReturnType<typeof useTrainTimer>;
  onOpenSelfMark: () => void;
  onOpenAskInSolve: () => void;
  onOpenSolveAPaper: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TrainTopBar({
  paper,
  leftPaper,
  rightPaper,
  onCloseLeft,
  onCloseRight,
  timer,
  onOpenSelfMark,
  onOpenAskInSolve,
  onOpenSolveAPaper,
  isSidebarOpen,
  onToggleSidebar,
}: TrainTopBarProps) {
  const { user } = useCurrentUser();
  const isDual = Boolean(leftPaper && rightPaper);
  const isSingle = Boolean((leftPaper && !rightPaper) || (!leftPaper && rightPaper));

  // Tier 2+ Contributor check or Staff
  const tierNumber =
    typeof user?.contributor_tier === "number"
      ? user.contributor_tier
      : typeof user?.contributor_tier === "object" && user.contributor_tier !== null
      ? (user.contributor_tier as { tier?: number }).tier ?? 0
      : 0;

  const canSolvePaper = tierNumber >= 2 || isAdminOrSuperAdmin(user?.role);

  // Format session label
  const sessionLabel =
    paper.session === "MAY_JUNE"
      ? "May / June"
      : paper.session === "OCT_NOV"
      ? "Oct / Nov"
      : paper.session === "JANUARY"
      ? "January"
      : paper.session || "";

  return (
    <header className="h-14 w-full border-b border-line bg-card/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-30 select-none">
      {/* Left Section: Back link & Navigation Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-line bg-surface text-ink-muted hover:text-ink hover:bg-muted/60 transition-colors cursor-pointer"
          title={isSidebarOpen ? "Collapse Curriculum Sidebar" : "Expand Curriculum Sidebar"}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="size-4" />
        </button>

        {/* Back Link to Resources */}
        <Link
          href="/resources"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 px-2 text-xs font-medium text-ink-muted hover:text-ink gap-1 shrink-0",
          })}
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Resources</span>
        </Link>

        <div className="h-4 w-px bg-line hidden sm:block shrink-0" />

        {/* Subject & Paper Identity */}
        <div className="flex items-center gap-2 min-w-0">
          {paper.subject_details && (
            <span className="text-xs font-semibold text-ink truncate max-w-[120px] sm:max-w-[180px] hidden md:inline">
              {paper.subject_details.name}
            </span>
          )}

          <Badge
            variant="outline"
            className="text-[11px] font-semibold border-line bg-surface text-ink px-2 py-0.5 shrink-0"
          >
            {paper.year} {sessionLabel && `· ${sessionLabel}`}
            {paper.paper_code ? ` · P${paper.paper_code}` : ""}{" "}
            {paper.paper_type ? `(${paper.paper_type})` : ""}
          </Badge>
        </div>
      </div>

      {/* Center Section: Resilient Timer Engine */}
      <div className="flex items-center justify-center shrink-0">
        <TimerWidget timer={timer} onOpenSelfMark={onOpenSelfMark} />
      </div>

      {/* Right Section: Dynamic View State, Active Chips & Contextual Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Dynamic Dual / Single Mode Indicator & Slots */}
        <div className="hidden lg:flex items-center gap-1.5">
          {isDual ? (
            <Badge
              variant="outline"
              className="text-xs font-semibold gap-1 px-2 py-1 border-primary/40 bg-primary/10 text-primary"
              title="Dual View Active: Showing Left and Right documents side by side"
            >
              <Columns2 className="size-3.5" />
              <span>Dual View</span>
            </Badge>
          ) : isSingle ? (
            <Badge
              variant="outline"
              className="text-xs font-semibold gap-1 px-2 py-1 border-line bg-surface text-ink-muted"
              title="Single View Active: Showing one document across workspace"
            >
              <Square className="size-3.5" />
              <span>Single View</span>
            </Badge>
          ) : null}

          {/* Active Left Document Chip */}
          {leftPaper && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-primary/30 bg-primary/5 text-xs text-primary font-medium max-w-[150px] xl:max-w-[180px]"
              title={`Left: ${leftPaper.file_name}`}
            >
              <span className="font-bold text-[9px] bg-primary text-primary-foreground px-1 rounded shrink-0">
                L
              </span>
              <span className="truncate">{leftPaper.file_name}</span>
              {onCloseLeft && (
                <button
                  type="button"
                  onClick={onCloseLeft}
                  className="p-0.5 text-primary/70 hover:text-destructive rounded transition-colors cursor-pointer shrink-0"
                  title="Close Left Panel"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {/* Active Right Document Chip */}
          {rightPaper && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-600 dark:text-emerald-400 font-medium max-w-[150px] xl:max-w-[180px]"
              title={`Right: ${rightPaper.file_name}`}
            >
              <span className="font-bold text-[9px] bg-emerald-600 text-white px-1 rounded shrink-0">
                R
              </span>
              <span className="truncate">{rightPaper.file_name}</span>
              {onCloseRight && (
                <button
                  type="button"
                  onClick={onCloseRight}
                  className="p-0.5 text-emerald-600/70 dark:text-emerald-400/70 hover:text-destructive rounded transition-colors cursor-pointer shrink-0"
                  title="Close Right Panel"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action: Ask in Solve! */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-line hover:border-primary/40 text-ink shadow-2xs"
          onClick={onOpenAskInSolve}
          title="Search existing solutions or ask community in Solve!"
        >
          <MessageSquare className="size-3.5 text-primary" />
          <span className="hidden xl:inline">Ask in Solve!</span>
        </Button>

        {/* Action: Solve a Paper (Tier 2+ / Staff) */}
        {canSolvePaper && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-brand/30 bg-brand/5 hover:bg-brand/10 text-brand shadow-2xs hidden md:flex"
            onClick={onOpenSolveAPaper}
            title="Author standalone worked solution for this paper (Tier 2+ Pro Contributor)"
          >
            <PenTool className="size-3.5" />
            <span className="hidden xl:inline">Solve a Paper</span>
          </Button>
        )}

        {/* Action: Self-Mark */}
        <Button
          size="sm"
          variant="default"
          className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-2xs"
          onClick={onOpenSelfMark}
          title="Open interactive self-assessment drawer"
        >
          <CheckSquare className="size-3.5" />
          <span>Self-Mark</span>
        </Button>
      </div>
    </header>
  );
}
