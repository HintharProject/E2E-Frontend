"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SubNav({
  items,
}: {
  items: { href: string; label: string; active?: boolean; onPrefetch?: () => void }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-px">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {items.map((item) => {
          const isActive = item.active ?? pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={item.onPrefetch}
              onTouchStart={item.onPrefetch}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-ink-muted hover:bg-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
