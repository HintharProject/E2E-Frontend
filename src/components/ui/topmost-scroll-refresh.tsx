"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRefreshStore } from "@/lib/store/refresh-store";

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

  // We enable pull if we are at the top of the closest scrollable container, or window
  const isAtTop = () => {
    const el = containerRef.current;
    if (!el) return window.scrollY <= 0;
    
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return parent.scrollTop <= 0;
      }
      parent = parent.parentElement;
    }
    return window.scrollY <= 0;
  };

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

  // Connect to global refresh store so the button in AppHeader can trigger it
  const { setTriggerRefresh, setIsRefreshing: setStoreIsRefreshing } = useRefreshStore();

  useEffect(() => {
    setTriggerRefresh(onRefresh as () => void);
    return () => setTriggerRefresh(() => {});
  }, [onRefresh, setTriggerRefresh]);

  useEffect(() => {
    setStoreIsRefreshing(isRefreshing);
  }, [isRefreshing, setStoreIsRefreshing]);

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
