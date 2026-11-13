"use client";

import React, { useState } from "react";
import { useTrainTimer } from "@/hooks/use-train";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerWidgetProps {
  timer: ReturnType<typeof useTrainTimer>;
  className?: string;
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

export function TimerWidget({ timer, className }: TimerWidgetProps) {
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
          mode === "UNTIMED_REVISION" && "border-border bg-muted/50 text-muted-foreground",
          mode !== "UNTIMED_REVISION" && !isWarning && !isCritical && !isExpired &&
            "border-border bg-card text-foreground shadow-2xs",
          isWarning && "border-warning/50 bg-warning/10 text-warning font-bold",
          isCritical && "border-destructive/60 bg-destructive/15 text-destructive font-bold motion-safe:animate-pulse",
          isExpired && "border-destructive bg-destructive/20 text-destructive font-black shadow-sm"
        )}
      >
        {/* Status icon */}
        {mode === "UNTIMED_REVISION" ? (
          <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
        ) : isExpired ? (
          <AlertTriangle className="size-3.5 text-destructive motion-safe:animate-pulse" aria-hidden="true" />
        ) : isCritical ? (
          <Flame className="size-3.5 text-destructive motion-safe:animate-pulse" aria-hidden="true" />
        ) : isWarning ? (
          <AlertTriangle className="size-3.5 text-warning" aria-hidden="true" />
        ) : (
          <Clock className={cn("size-3.5", isRunning ? "text-primary motion-safe:animate-spin" : "text-muted-foreground")} style={{ animationDuration: "8s" }} aria-hidden="true" />
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
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] md:min-h-[24px] md:min-w-[24px] p-1 hover:bg-muted/60 rounded-md transition-colors text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            title={isRunning ? "Pause Timer" : "Start Timer"}
            aria-label={isRunning ? "Pause Timer" : "Start Timer"}
          >
            {isRunning ? (
              <Pause className="size-3.5 fill-current" aria-hidden="true" />
            ) : (
              <Play className="size-3.5 fill-current" aria-hidden="true" />
            )}
          </button>
        )}

        {/* Reset Button */}
        {mode !== "UNTIMED_REVISION" && (
          <button
            type="button"
            onClick={() => resetTimer()}
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] md:min-h-[24px] md:min-w-[24px] p-1 hover:bg-muted/60 rounded-md transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
          </button>
        )}

        {/* Preset Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] md:min-h-[24px] md:min-w-[24px] p-0.5 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ml-0.5"
                title="Timer Options & Presets"
                aria-label="Timer Options"
              >
                <ChevronDown className="size-3" aria-hidden="true" />
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
        <div className="absolute top-12 right-0 z-40 w-72 rounded-xl border border-destructive/40 bg-card p-3 shadow-modal animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span>Time&apos;s Up!</span>
            </div>
            <button
              type="button"
              onClick={() => setShowExpiredBanner(false)}
              aria-label="Dismiss timer alert"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] -mr-2 -mt-2 md:mr-0 md:mt-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Your exam practice time has concluded. Review your answers against the Mark Scheme in Dual View.
          </p>
        </div>
      )}
    </div>
  );
}
