import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.ComponentProps<"select"> {
  sizeVariant?: "default" | "sm" | "lg";
}

export function Select({
  className,
  sizeVariant = "default",
  children,
  ...props
}: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        "w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors outline-none",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        sizeVariant === "sm" && "h-8 px-2.5 text-xs",
        sizeVariant === "default" && "h-10 px-3 text-sm",
        sizeVariant === "lg" && "h-12 px-4 text-base",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

