"use client";

import React, { useState } from "react";
import { useTrainTimer } from "@/hooks/use-train";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  ChevronDown,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerWidgetProps {
  timer: ReturnType<typeof useTrainTimer>;
  className?: string;
  onOpenSelfMark?: () => void;
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function TimerWidget({ timer, className, onOpenSelfMark }: TimerWidgetProps) {
  const {
    mode,
    targetDurationSeconds,
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    alertLevel,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
  } = timer;

  const [showExpiredBanner, setShowExpiredBanner] = useState(true);

  // Time display based on mode
  const displaySeconds =
    mode === "COUNTDOWN_EXAM" ? remainingSeconds : elapsedSeconds;

  const isWarning = alertLevel === "WARNING";
  const isCritical = alertLevel === "CRITICAL";
  const isExpired = alertLevel === "EXPIRED";

  return (
    <div className={cn("relative flex items-center gap-1.5 select-none", className)}>
      {/* Main Digital Clock Pill */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors duration-200",
          mode === "UNTIMED_REVISION" && "border-line bg-surface text-ink-muted",
          mode !== "UNTIMED_REVISION" && !isWarning && !isCritical && !isExpired &&
            "border-line bg-card text-ink shadow-2xs",
          isWarning && "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold",
          isCritical && "border-red-500/60 bg-red-500/15 text-red-600 dark:text-red-400 font-bold animate-pulse",
          isExpired && "border-red-600 bg-red-600/20 text-red-500 font-black shadow-sm"
        )}
      >
        {/* Status icon */}
        {mode === "UNTIMED_REVISION" ? (
          <Clock className="size-3.5 text-ink-muted" />
        ) : isExpired ? (
          <AlertTriangle className="size-3.5 text-red-500 animate-bounce" />
        ) : isCritical ? (
          <Flame className="size-3.5 text-red-500 animate-pulse" />
        ) : isWarning ? (
          <AlertTriangle className="size-3.5 text-amber-500" />
        ) : (
          <Clock className={cn("size-3.5", isRunning ? "text-primary animate-spin" : "text-ink-muted")} style={{ animationDuration: "8s" }} />
        )}

        {/* Readout */}
        <span className="font-mono tabular-nums text-sm tracking-tight">
          {mode === "UNTIMED_REVISION" ? "Untimed" : formatTime(displaySeconds)}
        </span>

        {/* Play/Pause Button */}
        {mode !== "UNTIMED_REVISION" && !isExpired && (
          <button
            type="button"
            onClick={isRunning ? pauseTimer : startTimer}
            className="p-1 hover:bg-muted/60 rounded-md transition-colors text-ink hover:text-primary cursor-pointer"
            title={isRunning ? "Pause Timer" : "Start Timer"}
            aria-label={isRunning ? "Pause Timer" : "Start Timer"}
          >
            {isRunning ? (
              <Pause className="size-3.5 fill-current" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
          </button>
        )}

        {/* Reset Button */}
        {mode !== "UNTIMED_REVISION" && (
          <button
            type="button"
            onClick={() => resetTimer()}
            className="p-1 hover:bg-muted/60 rounded-md transition-colors text-ink-muted hover:text-ink cursor-pointer"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="size-3" />
          </button>
        )}

        {/* Preset Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="p-0.5 hover:bg-muted/60 rounded text-ink-muted hover:text-ink cursor-pointer ml-0.5"
                title="Timer Options & Presets"
                aria-label="Timer Options"
              >
                <ChevronDown className="size-3" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Exam Countdown Presets</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => switchMode("COUNTDOWN_EXAM", 45 * 60)}
                className="justify-between"
              >
                <span>45m (MCQ Paper)</span>
                {mode === "COUNTDOWN_EXAM" && targetDurationSeconds === 45 * 60 && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchMode("COUNTDOWN_EXAM", 75 * 60)}
                className="justify-between"
              >
                <span>1h 15m (AS Theory)</span>
                {mode === "COUNTDOWN_EXAM" && targetDurationSeconds === 75 * 60 && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchMode("COUNTDOWN_EXAM", 105 * 60)}
                className="justify-between"
              >
                <span>1h 45m (A2 Theory)</span>
                {mode === "COUNTDOWN_EXAM" && targetDurationSeconds === 105 * 60 && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchMode("COUNTDOWN_EXAM", 120 * 60)}
                className="justify-between"
              >
                <span>2h (Extended Paper)</span>
                {mode === "COUNTDOWN_EXAM" && targetDurationSeconds === 120 * 60 && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>Practice Modes</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => switchMode("STOPWATCH_PRACTICE")}
                className="justify-between"
              >
                <span>Stopwatch (Count Up)</span>
                {mode === "STOPWATCH_PRACTICE" && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchMode("UNTIMED_REVISION")}
                className="justify-between"
              >
                <span>Untimed Revision</span>
                {mode === "UNTIMED_REVISION" && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Non-Blocking Expiry Toast Alert */}
      {isExpired && showExpiredBanner && (
        <div className="absolute top-12 right-0 z-40 w-72 rounded-xl border border-red-500/40 bg-card p-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Time&apos;s Up!</span>
            </div>
            <button
              type="button"
              onClick={() => setShowExpiredBanner(false)}
              className="text-ink-muted hover:text-ink text-xs p-0.5"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
            Your exam practice time has concluded. Switch to Dual View to review against the Mark Scheme and record your score.
          </p>
          {onOpenSelfMark && (
            <Button
              size="sm"
              variant="default"
              className="mt-2.5 w-full h-7 text-xs font-semibold bg-primary text-primary-foreground"
              onClick={() => {
                setShowExpiredBanner(false);
                onOpenSelfMark();
              }}
            >
              Open Mark Scheme & Self-Mark
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
