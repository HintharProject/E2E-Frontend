"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopmostScrollRefreshProps {
  onRefresh: () => Promise<unknown> | void;
  isRefreshing?: boolean;
  children: React.ReactNode;
  pullThreshold?: number;
  maxPullDistance?: number;
  className?: string;
  label?: string;
}

export function TopmostScrollRefresh({
  onRefresh,
  isRefreshing = false,
  children,
  pullThreshold = 80,
  maxPullDistance = 150,
  className,
  label = "feed",
}: TopmostScrollRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  // We only enable pull if we are at the absolute top of the window
  const isAtTop = () => window.scrollY <= 0;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isAtTop()) return;
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    setIsPulling(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling) return;
      currentY.current = e.touches[0].clientY;
      const dy = currentY.current - startY.current;

      // Only pull down
      if (dy > 0 && isAtTop()) {
        // Prevent default overscroll bounce
        if (e.cancelable) e.preventDefault();
        
        // Dampen the pull
        const dampened = maxPullDistance * Math.log10(1 + (dy / maxPullDistance));
        setPullDistance(Math.min(dampened, maxPullDistance));
      }
    },
    [isPulling, maxPullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance > pullThreshold && !isRefreshing) {
      // Trigger refresh
      setPullDistance(pullThreshold); // keep it open at threshold while refreshing (handled by transition)
      await onRefresh();
    }
    
    // Reset visual pull unless it's currently refreshing (we might want it to slide up)
    setPullDistance(0);
  }, [isPulling, pullDistance, pullThreshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle success state briefly when refreshing finishes
  const wasRefreshing = useRef(isRefreshing);
  useEffect(() => {
    if (wasRefreshing.current && !isRefreshing) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
    wasRefreshing.current = isRefreshing;
  }, [isRefreshing]);

  const pullPercentage = Math.min(1, pullDistance / pullThreshold);
  const isPastThreshold = pullDistance >= pullThreshold;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Background/Floating Refresh Indicator (Desktop/Manual + Pull) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isRefreshing ? (
            <>
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="font-medium animate-pulse">Updating {label}...</span>
            </>
          ) : showSuccess ? (
            <>
              <Check className="size-4 text-green-500" />
              <span className="font-medium text-green-600 dark:text-green-400">Refreshed</span>
            </>
          ) : (
            <span className="hidden sm:inline-block">Up to date</span>
          )}
        </div>
        
        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={() => onRefresh()}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 cursor-pointer"
          title={`Refresh ${label}`}
        >
          <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Pull Indicator Overlay (Mobile Touch) */}
      <div 
        className={cn(
          "absolute left-0 right-0 top-0 z-10 flex justify-center overflow-hidden transition-opacity duration-200 pointer-events-none",
          pullDistance > 0 && !isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: `${pullDistance}px`,
        }}
      >
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-line shadow-sm transition-transform"
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 50)}px) rotate(${pullPercentage * 360}deg)`,
            opacity: pullPercentage,
          }}
        >
          <RefreshCw 
            className={cn(
              "size-5 text-muted-foreground transition-colors",
              isPastThreshold && "text-primary"
            )} 
          />
        </div>
      </div>

      {/* Content wrapper */}
      <div 
        style={{
          transform: pullDistance > 0 && !isRefreshing ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
