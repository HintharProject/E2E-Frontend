"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetadataPillBarProps {
  children: React.ReactNode;
  errors?: Array<string | undefined>;
  className?: string;
}

export function MetadataPillBar({
  children,
  errors = [],
  className,
}: MetadataPillBarProps) {
  const activeErrors = errors.filter((e): e is string => Boolean(e && e.trim()));

  return (
    <div className={cn("space-y-2 border-b border-border/75 pb-4", className)}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {activeErrors.length > 0 && (
        <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {activeErrors.map((err, idx) => (
            <p key={idx} className="text-xs font-medium text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export interface MetadataSelectPillProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  invalid?: boolean;
}

export const MetadataSelectPill = React.forwardRef<
  HTMLSelectElement,
  MetadataSelectPillProps
>(function MetadataSelectPill(
  { label, required, invalid, value, className, children, ...rest },
  ref
) {
  const isEmpty = !value || String(value).trim() === "";

  return (
    <div className="relative inline-flex items-center">
      <select
        ref={ref}
        aria-label={label}
        aria-required={required}
        aria-invalid={invalid}
        value={value}
        data-empty={isEmpty ? "true" : "false"}
        className={cn(
          "min-h-[44px] sm:min-h-[34px] appearance-none rounded-lg border bg-card py-1.5 pr-8 pl-3 text-base sm:text-xs font-medium shadow-sm transition-colors cursor-pointer",
          "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-destructive text-destructive" : "border-input",
          isEmpty && !invalid ? "text-muted-foreground" : "text-foreground",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
});

export interface MetadataTogglePillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  hasValue?: boolean;
  icon?: React.ReactNode;
}

export function MetadataTogglePill({
  active = false,
  hasValue = false,
  icon,
  children,
  className,
  type = "button",
  ...rest
}: MetadataTogglePillProps) {
  return (
    <button
      type={type}
      aria-expanded={active}
      data-active={active || hasValue ? "true" : "false"}
      className={cn(
        "inline-flex min-h-[44px] sm:min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active || hasValue
          ? "border border-primary/45 bg-card text-foreground shadow-sm"
          : "border border-dashed border-input bg-transparent text-muted-foreground hover:border-primary/45 hover:bg-card hover:text-foreground",
        className
      )}
      {...rest}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

