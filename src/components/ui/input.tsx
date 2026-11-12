import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  sizeVariant?: "default" | "sm" | "lg";
}

export function Input({
  className,
  type,
  sizeVariant = "default",
  ...props
}: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground outline-none",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        sizeVariant === "sm" && "h-8 px-2.5 text-xs",
        sizeVariant === "default" && "h-10 px-3 text-sm",
        sizeVariant === "lg" && "h-12 px-4 text-base",
        className
      )}
      {...props}
    />
  );
}
