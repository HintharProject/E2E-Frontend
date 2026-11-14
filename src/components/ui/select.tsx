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
        "w-full cursor-pointer rounded-lg border border-input bg-card px-3 text-foreground transition-colors outline-none",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        sizeVariant === "sm" && "min-h-[36px] h-9 px-2.5 text-sm sm:text-xs",
        sizeVariant === "default" && "min-h-[44px] sm:min-h-[40px] h-11 sm:h-10 px-3 text-base sm:text-sm",
        sizeVariant === "lg" && "min-h-[48px] h-12 px-4 text-base",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
