"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SubNav({
  items,
}: {
  items: { href: string; label: string; active?: boolean }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line pb-px">
      {items.map((item) => {
        const isActive = item.active ?? pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
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
    </nav>
  );
}
