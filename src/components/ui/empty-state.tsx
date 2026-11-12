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
        "rounded-xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mx-auto mb-3 inline-flex rounded-full bg-muted p-3 text-muted-foreground">
          <Icon className="size-6" />
        </div>
      )}
      <p className="font-heading font-semibold text-base sm:text-lg text-foreground">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
