"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_NAV, isNavActive } from "@/lib/constants";
import { useUIStore } from "@/lib/store/ui-store";
import type { AppUser } from "@/types/user";

interface MobileNavProps {
  user: AppUser | null;
}

/**
 * Mobile navigation overlay panel.
 * Slides down from the header on small screens.
 * Controlled by the Zustand UI store (isMobileNavOpen).
 */
export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav } = useUIStore();

  if (!isMobileNavOpen) return null;

  const visibleNav = PRIMARY_NAV.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 border-b border-border bg-background shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-heading text-lg font-semibold tracking-tight text-primary">
            E2E
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileNav}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1 px-4 pb-4">
          {visibleNav.map((item) => {
            const active = isNavActive(pathname, item.match, item.exclude);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {user && (
            <Link
              href={`/users/${user.id}`}
              onClick={closeMobileNav}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/users/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Profile
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
