import type { ReactNode } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-[140px] flex-1 flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {label}
      {children}
    </label>
  );
}
