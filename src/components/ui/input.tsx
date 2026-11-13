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
        "w-full rounded-lg border border-input bg-card px-3 text-foreground transition-colors placeholder:text-muted-foreground outline-none",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        sizeVariant === "sm" && "min-h-[36px] h-9 px-2.5 text-sm sm:text-xs",
        sizeVariant === "default" && "min-h-[44px] sm:min-h-[40px] h-11 sm:h-10 px-3 text-base sm:text-sm",
        sizeVariant === "lg" && "min-h-[48px] h-12 px-4 text-base",
        className
      )}
      {...props}
    />
  );
}
