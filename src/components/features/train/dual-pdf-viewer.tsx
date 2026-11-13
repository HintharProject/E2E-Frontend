"use client";

import React, { useState, useRef, useCallback } from "react";
import { Resource } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  BookOpen,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DualPdfViewerProps {
  leftResource?: Resource | null;
  rightResource?: Resource | null;
  onCloseLeft?: () => void;
  onCloseRight?: () => void;
  isLoadingLeft?: boolean;
  isLoadingRight?: boolean;
}

interface PanelControlsState {
  zoom: number; // 0.5 to 2.0
  isFullscreen: boolean;
}

export function DualPdfViewer({
  leftResource,
  rightResource,
  onCloseLeft,
  onCloseRight,
  isLoadingLeft = false,
  isLoadingRight = false,
}: DualPdfViewerProps) {
  // Split ratio for desktop dual view (default 50%, clamped 30%-70%)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("train_split_ratio");
        if (saved) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= 30 && parsed <= 70) {
            return parsed;
          }
        }
      } catch {
        // Ignore
      }
    }
    return 50;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile active tab (< 1024px): "LEFT" | "RIGHT"
  const [mobileActiveTab, setMobileActiveTab] = useState<"LEFT" | "RIGHT">("LEFT");

  // Panel control states
  const [leftControls, setLeftControls] = useState<PanelControlsState>({
    zoom: 1.0,
    isFullscreen: false,
  });

  const [rightControls, setRightControls] = useState<PanelControlsState>({
    zoom: 1.0,
    isFullscreen: false,
  });

  // Splitter drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(70, Math.max(30, Math.round(newRatio * 10) / 10));
    setSplitRatio(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
      localStorage.setItem("train_split_ratio", splitRatio.toString());
    } catch {
      // Ignore
    }
  };

  // Zoom handlers
  const handleZoom = useCallback((side: "LEFT" | "RIGHT", action: "in" | "out" | "reset") => {
    const updater = side === "LEFT" ? setLeftControls : setRightControls;
    updater((prev) => {
      let nextZoom = prev.zoom;
      if (action === "in") nextZoom = Math.min(2.0, Math.round((prev.zoom + 0.1) * 10) / 10);
      else if (action === "out") nextZoom = Math.max(0.5, Math.round((prev.zoom - 0.1) * 10) / 10);
      else if (action === "reset") nextZoom = 1.0;
      return { ...prev, zoom: nextZoom };
    });
  }, []);

  // Fullscreen handlers
  const toggleFullscreen = useCallback((side: "LEFT" | "RIGHT") => {
    const updater = side === "LEFT" ? setLeftControls : setRightControls;
    updater((prev) => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  const hasLeft = Boolean(leftResource) || Boolean(isLoadingLeft);
  const hasRight = Boolean(rightResource) || Boolean(isLoadingRight);
  const isDual = hasLeft && hasRight;

  // Render individual document panel toolbar & viewport
  const renderPanel = (
    side: "LEFT" | "RIGHT",
    resource?: Resource | null,
    isLoading?: boolean,
    onClose?: () => void
  ) => {
    const controls = side === "LEFT" ? leftControls : rightControls;
    const isQP = resource?.paper_type === "QP";
    const title = isLoading
      ? "Opening document..."
      : resource?.file_name || (side === "LEFT" ? "Left Document" : "Right Document");

    return (
      <div
        className={cn(
          "flex flex-col h-full w-full bg-card overflow-hidden transition-all",
          controls.isFullscreen && "fixed inset-0 z-50 bg-background"
        )}
      >
        {/* Panel Mini Toolbar */}
        <div className="h-10 px-3 border-b border-border bg-muted/40 flex items-center justify-between gap-2 shrink-0 select-none">
          <div className="flex items-center gap-2 min-w-0">
            {isLoading ? (
              <Loader2 className="size-3.5 text-primary animate-spin shrink-0" aria-hidden="true" />
            ) : isQP ? (
              <FileText className="size-3.5 text-primary shrink-0" aria-hidden="true" />
            ) : (
              <BookOpen className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            )}
            <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[320px]" title={title}>
              {title}
            </span>
            {resource && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 font-mono font-bold uppercase shrink-0",
                  isQP
                    ? "border-primary/35 text-primary bg-primary/10"
                    : "border-border text-secondary-foreground bg-secondary"
                )}
              >
                {resource.paper_type || (side === "LEFT" ? "QP" : "MS")}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="text-[9px] px-1 py-0 font-mono font-bold uppercase hidden sm:inline-flex"
            >
              {side === "LEFT" ? "Pane L" : "Pane R"}
            </Badge>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => handleZoom(side, "out")}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:opacity-40"
                title="Zoom Out"
                aria-label="Zoom out document"
                disabled={controls.zoom <= 0.5}
              >
                <ZoomOut className="size-3" aria-hidden="true" />
              </button>
              <span className="px-1.5 text-[10px] font-mono font-medium text-foreground tabular-nums">
                {Math.round(controls.zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(side, "in")}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:opacity-40"
                title="Zoom In"
                aria-label="Zoom in document"
                disabled={controls.zoom >= 2.0}
              >
                <ZoomIn className="size-3" aria-hidden="true" />
              </button>
              {controls.zoom !== 1.0 && (
                <button
                  type="button"
                  onClick={() => handleZoom(side, "reset")}
                  className="p-1 border-l border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  title="Reset Zoom"
                  aria-label="Reset zoom to 100%"
                >
                  <RotateCcw className="size-2.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Open in New Tab */}
            {resource?.file_url && (
              <a
                href={resource.file_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
                title="Open PDF in new tab"
                aria-label={`Open ${title} in new tab`}
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}

            {/* Download */}
            {resource?.file_url && (
              <a
                href={resource.download_url || resource.file_url}
                download={title}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
                title="Download PDF"
                aria-label={`Download ${title}`}
              >
                <Download className="size-3.5" aria-hidden="true" />
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => toggleFullscreen(side)}
              aria-label={controls.isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
              title={controls.isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {controls.isFullscreen ? (
                <Minimize2 className="size-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="size-3.5" aria-hidden="true" />
              )}
            </button>

            {/* Close Pane Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${side === "LEFT" ? "Left" : "Right"} Pane`}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-[28px] md:min-w-[28px] p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer ml-1"
                title={`Close ${side === "LEFT" ? "Left" : "Right"} Pane`}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* PDF Frame Canvas Viewport */}
        <div className="flex-1 w-full h-full relative overflow-auto bg-muted/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 select-none">
              <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
              <p className="text-xs font-medium">Opening document...</p>
            </div>
          ) : resource?.file_url ? (
            <div
              className="w-full h-full origin-top-left transition-transform duration-75"
              style={{
                width: `${100 / controls.zoom}%`,
                height: `${100 / controls.zoom}%`,
                transform: `scale(${controls.zoom})`,
              }}
            >
              <iframe
                key={resource.file_url}
                src={`${resource.file_url}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title={title}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <FileText className="size-8 stroke-1" aria-hidden="true" />
              <p className="text-xs">Document preview unavailable</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Case 0: Neither Left nor Right active
  if (!hasLeft && !hasRight) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-card/40 text-muted-foreground gap-3 p-8 select-none">
        <BookOpen className="size-12 text-muted-foreground/40 stroke-1" aria-hidden="true" />
        <h3 className="font-heading text-base font-semibold text-foreground">No Documents Open in Workspace</h3>
        <p className="text-xs text-muted-foreground max-w-sm text-center leading-relaxed">
          Open the curriculum sidebar on the left and select <span className="font-mono font-semibold text-primary">[L]</span> or <span className="font-mono font-semibold text-foreground">[R]</span> on a paper to view it here.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full flex flex-col overflow-hidden">
      {/* Mobile Segmented Switcher Header (< 1024px) when both are active */}
      {isDual && (
        <div className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg border border-border bg-card w-full">
            <button
              type="button"
              onClick={() => setMobileActiveTab("LEFT")}
              className={cn(
                "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer truncate px-2",
                mobileActiveTab === "LEFT"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Left: {isLoadingLeft ? "Loading..." : leftResource?.file_name || "Paper"}
            </button>

            <button
              type="button"
              onClick={() => setMobileActiveTab("RIGHT")}
              className={cn(
                "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer truncate px-2",
                mobileActiveTab === "RIGHT"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Right: {isLoadingRight ? "Loading..." : rightResource?.file_name || "Paper"}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Single View or Active Tab (< 1024px) */}
      <div className="lg:hidden flex-1 w-full h-full overflow-hidden">
        {isDual ? (
          mobileActiveTab === "LEFT" ? (
            renderPanel("LEFT", leftResource, isLoadingLeft, onCloseLeft)
          ) : (
            renderPanel("RIGHT", rightResource, isLoadingRight, onCloseRight)
          )
        ) : hasLeft ? (
          renderPanel("LEFT", leftResource, isLoadingLeft, onCloseLeft)
        ) : (
          renderPanel("RIGHT", rightResource, isLoadingRight, onCloseRight)
        )}
      </div>

      {/* Desktop View (>= 1024px) */}
      <div className="hidden lg:flex flex-1 w-full h-full overflow-hidden">
        {/* Single View: Only Left is active */}
        {hasLeft && !hasRight && (
          <div className="w-full h-full">
            {renderPanel("LEFT", leftResource, isLoadingLeft, onCloseLeft)}
          </div>
        )}

        {/* Single View: Only Right is active */}
        {!hasLeft && hasRight && (
          <div className="w-full h-full">
            {renderPanel("RIGHT", rightResource, isLoadingRight, onCloseRight)}
          </div>
        )}

        {/* Dual View: Both Left and Right are active */}
        {isDual && (
          <div className="flex w-full h-full overflow-hidden">
            {/* Left Panel */}
            <div
              style={{ width: `${splitRatio}%` }}
              className="h-full flex flex-col overflow-hidden"
            >
              {renderPanel("LEFT", leftResource, isLoadingLeft, onCloseLeft)}
            </div>

            {/* Draggable & Keyboard-Accessible Divider Handle */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize split document panes"
              aria-valuemin={30}
              aria-valuemax={70}
              aria-valuenow={Math.round(splitRatio)}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  setSplitRatio((prev) => {
                    const next = Math.max(30, prev - 5);
                    try { localStorage.setItem("train_split_ratio", next.toString()); } catch {}
                    return next;
                  });
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  setSplitRatio((prev) => {
                    const next = Math.min(70, prev + 5);
                    try { localStorage.setItem("train_split_ratio", next.toString()); } catch {}
                    return next;
                  });
                }
              }}
              className={cn(
                "w-1.5 hover:w-2 bg-border hover:bg-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-col-resize flex items-center justify-center group shrink-0 relative select-none",
                isDragging && "bg-primary w-2 shadow-lg"
              )}
              title="Drag or use Left/Right arrows to resize split panes (30% - 70%)"
            >
              <div className="w-0.5 h-8 rounded-full bg-muted-foreground/40 group-hover:bg-primary-foreground" />
            </div>

            {/* Right Panel */}
            <div
              style={{ width: `${100 - splitRatio}%` }}
              className="h-full flex flex-col overflow-hidden"
            >
              {renderPanel("RIGHT", rightResource, isLoadingRight, onCloseRight)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
