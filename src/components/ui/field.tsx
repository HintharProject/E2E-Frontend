import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  asGroup?: boolean;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  asGroup = false,
  required = false,
  description,
  error,
  className,
  children,
}: FieldProps) {
  const labelId = React.useId();

  const labelElement = (
    <span
      id={asGroup ? labelId : undefined}
      className="flex items-center gap-1 text-sm font-medium text-foreground"
    >
      {label}
      {required && (
        <span className="text-destructive text-sm leading-none" aria-hidden="true">
          *
        </span>
      )}
    </span>
  );

  return (
    <div
      role={asGroup ? "group" : undefined}
      aria-labelledby={asGroup ? labelId : undefined}
      className={cn("flex min-w-[140px] flex-1 flex-col gap-1.5", className)}
    >
      {asGroup ? (
        <>
          {labelElement}
          {children}
        </>
      ) : htmlFor ? (
        <>
          <label htmlFor={htmlFor} className="cursor-pointer">
            {labelElement}
          </label>
          {children}
        </>
      ) : (
        <label className="flex flex-col gap-1.5 cursor-pointer">
          {labelElement}
          {children}
        </label>
      )}

      {description && !error && (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}

      {error && (
        <p
          className="mt-0.5 flex items-center gap-1 text-xs font-medium text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
