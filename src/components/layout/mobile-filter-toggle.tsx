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
        <div className="fixed inset-x-0 bottom-0 top-[112px] z-50 overflow-y-auto bg-background/95 p-4 shadow-md backdrop-blur-md lg:hidden sm:p-6">
          <Suspense fallback={null}>
            <FilterContent {...props} />
          </Suspense>
        </div>
      )}
    </>
  );
}
