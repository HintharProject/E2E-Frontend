"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  href: string;
  label: string;
  active?: boolean;
  onPrefetch?: () => void;
}

export interface SubNavProps {
  items: SubNavItem[];
  variant?: "pill" | "underline";
  className?: string;
}

export function SubNav({
  items,
  variant = "pill",
  className,
}: SubNavProps) {
  const pathname = usePathname();

  if (variant === "underline") {
    return (
      <nav
        aria-label="Secondary navigation"
        data-slot="sub-nav"
        data-variant="underline"
        className={cn(
          "flex items-center gap-5 overflow-x-auto scrollbar-none border-b border-border",
          className
        )}
      >
        {items.map((item) => {
          const isActive = item.active ?? pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={item.onPrefetch}
              onTouchStart={item.onPrefetch}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative -mb-px inline-flex min-h-[44px] sm:min-h-[38px] items-center whitespace-nowrap px-0.5 py-2 text-xs sm:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xs after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-colors",
                isActive
                  ? "font-semibold text-foreground after:bg-primary"
                  : "font-medium text-muted-foreground hover:text-foreground hover:after:bg-border"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Secondary navigation"
      data-slot="sub-nav"
      data-variant="pill"
      className={cn(
        "flex items-center overflow-x-auto scrollbar-none",
        className
      )}
    >
      <div className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-secondary/70 p-1">
        {items.map((item) => {
          const isActive = item.active ?? pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={item.onPrefetch}
              onTouchStart={item.onPrefetch}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-[40px] sm:min-h-[32px] items-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs sm:text-sm transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border border-border/70 bg-card font-semibold text-foreground shadow-2xs"
                  : "border border-transparent font-medium text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
