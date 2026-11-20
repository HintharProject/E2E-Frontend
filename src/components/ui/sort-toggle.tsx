"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SortToggleOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
}

export interface SortToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SortToggleOption<T>[];
  "aria-label": string;
  className?: string;
}

/**
 * Shared segmented sort toggle used across comment threads and solution lists.
 */
export function SortToggle<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
}: SortToggleProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="sort-toggle"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/45 p-[3px]",
        className
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            data-active={isActive ? "true" : "false"}
            aria-pressed={isActive}
            title={opt.title ?? `Sort by ${opt.label}`}
            className={cn(
              "inline-flex min-h-[36px] sm:min-h-[28px] items-center justify-center gap-1.5 rounded-sm px-3 sm:px-2.5 font-sans text-xs whitespace-nowrap cursor-pointer select-none touch-manipulation transition-[background-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? "bg-card text-foreground font-semibold shadow-sm"
                : "bg-transparent text-muted-foreground font-medium hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  isActive ? "text-primary" : "text-current"
                )}
                aria-hidden="true"
              />
            )}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

