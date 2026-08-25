"use client";

import { useState } from "react";
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
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background/90 px-4 py-3 backdrop-blur-md">
            <h2 className="font-semibold text-ink">Filters</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-muted hover:text-ink"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar sm:p-6 pb-24">
            <Suspense fallback={null}>
              <FilterContent {...props} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
