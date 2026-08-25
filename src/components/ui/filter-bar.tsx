import type { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white/80 p-3 dark:bg-card/50">
      {children}
    </div>
  );
}
