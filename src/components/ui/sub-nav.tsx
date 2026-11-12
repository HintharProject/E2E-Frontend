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

  return (
    <nav
      aria-label="Secondary navigation"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -my-1",
        variant === "underline" && "border-b border-border gap-4 pb-2",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-1.5 min-w-0">
        {items.map((item) => {
          const isActive = item.active ?? pathname === item.href;

          if (variant === "underline") {
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={item.onPrefetch}
                onTouchStart={item.onPrefetch}
                className={cn(
                  "relative whitespace-nowrap pb-2 pt-1 text-xs sm:text-sm font-semibold transition-colors min-h-[36px] inline-flex items-center",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={item.onPrefetch}
              onTouchStart={item.onPrefetch}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/25 font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
