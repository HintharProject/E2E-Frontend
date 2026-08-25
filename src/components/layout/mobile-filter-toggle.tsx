"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Suspense } from "react";
import { FilterContent, type FilterSidebarProps } from "@/components/layout/filter-sidebar";

/**
 * Mobile-only filter toggle button + collapsible panel.
 * Renders only on screens smaller than lg (hidden on lg+).
 * Placed in the sub-nav mobileExtra slot.
 */
export function MobileFilterToggle(props: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      {/* Trigger button — shown in sub-nav bar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors lg:hidden ${
          open
            ? "border-brand bg-brand/10 text-brand-dark"
            : "border-line bg-card text-ink-muted hover:border-brand/40 hover:text-ink"
        }`}
        aria-expanded={open}
        aria-label="Toggle filters"
      >
        {open ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <SlidersHorizontal className="h-3.5 w-3.5" />
        )}
        Filters
      </button>

      {/* Collapsible panel — slides down full screen under the header */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 flex flex-col bg-background border-b border-line shadow-xl lg:hidden max-h-[calc(100vh-130px)]">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar sm:p-6 pb-6">
            <Suspense fallback={null}>
              <FilterContent {...props} isMobile={true} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
