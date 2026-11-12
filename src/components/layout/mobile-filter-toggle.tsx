"use client";

import { useState, useEffect, Suspense } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterContent, type FilterSidebarProps } from "@/components/layout/filter-sidebar";
import { parseFilterList } from "@/lib/filter-params";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Mobile-only filter toggle button + slide-up bottom sheet drawer.
 * Renders only on screens smaller than lg (hidden on lg+).
 */
export function MobileFilterToggle(props: FilterSidebarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));
  const postTypes = parseFilterList(searchParams.get("post_type"));
  const tags = parseFilterList(searchParams.get("tags"));
  const status = searchParams.get("status");
  const state = searchParams.get("state");

  let activeFilterCount = subjects.length + levels.length + postTypes.length + tags.length;
  if (status) activeFilterCount += 1;
  if (state && state !== "PUBLISHED") activeFilterCount += 1;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleReset = () => {
    router.push(pathname);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button — shown on mobile/tablet */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-[36px] sm:min-h-[44px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors lg:hidden cursor-pointer",
          activeFilterCount > 0
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
        )}
        aria-expanded={open}
        aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
      >
        <SlidersHorizontal className="size-3.5" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile Bottom Sheet Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-up sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-semibold text-foreground">
                  Filter Content
                </span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {activeFilterCount} active
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="size-11 rounded-lg"
                aria-label="Close filters"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Scrollable Filter Controls */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
              <Suspense fallback={<div className="h-40 rounded-xl bg-card border border-border animate-pulse" />}>
                <FilterContent {...props} isMobile={true} />
              </Suspense>
            </div>

            {/* Sticky Action Footer */}
            <div className="border-t border-border bg-card/60 p-4 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={activeFilterCount === 0}
                className="flex-1 min-h-[44px] gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset All</span>
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => setOpen(false)}
                className="flex-1 min-h-[44px] text-xs font-semibold cursor-pointer"
              >
                Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
