"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { X, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { useStudyPlans, useSavedSessions } from "@/hooks/use-collections";
import { isNavActive } from "@/lib/constants";
import { useUIStore } from "@/lib/store/ui-store";
import { isAdminOrSuperAdmin, isStaffRole, type AppUser } from "@/types/user";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_NAV_ITEMS,
  LIBRARY_NAV_ITEMS,
  STAFF_NAV_ITEMS,
  getUserInitials,
  type ShellNavItem,
} from "./nav-config";

interface MobileNavProps {
  user: AppUser | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav } = useUIStore();
  const { data: studyPlans } = useStudyPlans();
  const { data: savedSessions } = useSavedSessions();

  useEffect(() => {
    if (!isMobileNavOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen, closeMobileNav]);

  if (!isMobileNavOpen) return null;

  const isStaff = user ? isStaffRole(user.role) : false;
  const isAdmin = user ? isAdminOrSuperAdmin(user.role) : false;
  const visibleStaffItems = STAFF_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const getLibraryCount = (item: ShellNavItem): string | null => {
    if (!user) return null;
    if (item.libraryKey === "plans" && Array.isArray(studyPlans)) {
      return `${studyPlans.length}/3`;
    }
    if (item.libraryKey === "sessions" && Array.isArray(savedSessions)) {
      return `${savedSessions.length}/3`;
    }
    return null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Slide-over panel from left */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-modal animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/"
            onClick={closeMobileNav}
            className="flex items-center gap-2.5"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold tracking-tight">
              E2
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-semibold tracking-tight text-foreground">
                E2E
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Hinthar Education
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeMobileNav}
              className="size-11 rounded-lg"
              aria-label="Close navigation menu"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Scrollable Nav Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {/* User Profile Card */}
          {user ? (
            <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar size="sm">
                    {user.image_url && (
                      <AvatarImage src={user.image_url} alt={user.display_name} />
                    )}
                    <AvatarFallback>{getUserInitials(user.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {user.display_name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {isStaff ? (
                        <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                          {user.role}
                        </Badge>
                      ) : (
                        <ContributorBadge tier={user.contributor_tier} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "size-8",
                    },
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/60">
                <Link
                  href={`/users/${user.id}`}
                  onClick={closeMobileNav}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <UserIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/settings/profile"
                  onClick={closeMobileNav}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Sign in to unlock personalized study tracks
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  closeMobileNav();
                  window.dispatchEvent(new CustomEvent("open-dev-tools"));
                }}
                className="w-full min-h-[44px] text-xs font-semibold"
              >
                Switch Account / Sign In
              </Button>
            </div>
          )}

          {/* Group 1: Workspace */}
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </div>
            <nav aria-label="Workspace" className="flex flex-col gap-1">
              {WORKSPACE_NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.match, item.exclude);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNav}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Group 2: My Library */}
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Library
            </div>
            <nav aria-label="My Library" className="flex flex-col gap-1">
              {LIBRARY_NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.match, item.exclude);
                const Icon = item.icon;
                const countText = getLibraryCount(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNav}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </span>
                    {countText && (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
                        {countText}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Group 3: Staff Studio */}
          {isStaff && (
            <div>
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-warning">
                Staff Studio
              </div>
              <nav aria-label="Staff Studio" className="flex flex-col gap-1">
                {visibleStaffItems.map((item) => {
                  const active = isNavActive(pathname, item.match, item.exclude);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileNav}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-warning/15 text-warning border border-warning/30 font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
