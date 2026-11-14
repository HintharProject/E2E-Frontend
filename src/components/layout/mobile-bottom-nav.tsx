"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MOBILE_BOTTOM_NAV_ITEMS } from "./nav-config";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5 items-stretch">
        {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.match, item.exclude);
          const Icon = item.icon;
          const label = item.shortLabel ?? item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] leading-none transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                active
                  ? "font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary"
                />
              )}
              <Icon
                className={cn("size-5 shrink-0", active && "text-primary")}
                aria-hidden="true"
              />
              <span className="truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

