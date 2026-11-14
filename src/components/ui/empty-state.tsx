import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "rounded-xl border border-dashed border-border bg-card/60 p-8 sm:p-12 text-center",
        className
      )}
    >
      {Icon && (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full border border-border/70 bg-muted/50 text-muted-foreground"
        >
          <Icon className="size-5" />
        </div>
      )}
      <p className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground text-balance">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>
      )}
    </div>
  );
}
