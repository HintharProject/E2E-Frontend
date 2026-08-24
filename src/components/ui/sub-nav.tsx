"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SubNav({
  items,
  mobileExtra,
}: {
  items: { href: string; label: string; active?: boolean; onPrefetch?: () => void }[];
  mobileExtra?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-[57px] z-30 -mx-4 mb-6 flex items-center gap-1 overflow-x-auto border-b border-line bg-background/90 px-4 pb-px backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {items.map((item) => {
          const isActive = item.active ?? pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={item.onPrefetch}
              onTouchStart={item.onPrefetch}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "border-brand text-brand-dark"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {mobileExtra && (
        <div className="flex shrink-0 items-center gap-2 pl-2">
          {mobileExtra}
        </div>
      )}
    </nav>
  );
}
