"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCog,
  ArrowUpRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useStudyPlans, useSavedSessions } from "@/hooks/use-collections";
import { isNavActive } from "@/lib/constants";
import { useUIStore } from "@/lib/store/ui-store";
import { isAdminOrSuperAdmin, isStaffRole } from "@/types/user";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_NAV_ITEMS,
  LIBRARY_NAV_ITEMS,
  STAFF_NAV_ITEMS,
  getUserInitials,
  type ShellNavItem,
} from "./nav-config";

interface LastTrainPaper {
  id: string;
  title?: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const { data: studyPlans } = useStudyPlans();
  const { data: savedSessions } = useSavedSessions();
  const [lastTrainPaper, setLastTrainPaper] = useState<LastTrainPaper | null>(null);

  // Hydrate collapsed preference from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("e2e_sidebar_collapsed");
      if (stored === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [setSidebarCollapsed]);

  // Read optional last Train! paper for quick-resume link
  useEffect(() => {
    try {
      const raw = localStorage.getItem("e2e_last_train_paper");
      if (!raw) return;
      if (raw.startsWith("{")) {
        const parsed = JSON.parse(raw) as LastTrainPaper;
        if (parsed?.id) setLastTrainPaper(parsed);
      } else {
        setLastTrainPaper({ id: raw });
      }
    } catch {
      // Ignore malformed localStorage value
    }
  }, [pathname]);

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
    <aside
      aria-label="Primary sidebar navigation"
      className={cn(
        "hidden md:flex flex-col shrink-0 sticky top-0 h-dvh border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out z-40",
        isSidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Top Brand Header (h-14 aligns cleanly with AppTopBar) */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border",
          isSidebarCollapsed ? "justify-center px-2" : "justify-between px-3.5"
        )}
      >
        {!isSidebarCollapsed && (
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold tracking-tight shadow-2xs">
              E2
            </span>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-display text-base font-semibold tracking-tight text-foreground truncate">
                E2E
              </span>
              <span className="text-xs font-medium text-muted-foreground truncate">
                Hinthar Education
              </span>
            </div>
          </Link>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/70 shrink-0"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-5 custom-scrollbar">
        {/* Group 1: Workspace */}
        <div>
          {!isSidebarCollapsed && (
            <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </div>
          )}
          <nav aria-label="Workspace" className="flex flex-col gap-1">
            {WORKSPACE_NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.match, item.exclude);
              const Icon = item.icon;
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    title={isSidebarCollapsed ? item.label : undefined}
                    aria-label={isSidebarCollapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      isSidebarCollapsed
                        ? "justify-center size-10 mx-auto"
                        : "h-9 px-2.5 gap-2.5",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-primary/20 shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden="true"
                    />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>

                  {/* Optional Resume Paper quick-link under Exams & Resources */}
                  {item.href === "/resources" &&
                    lastTrainPaper &&
                    !isSidebarCollapsed && (
                      <Link
                        href={`/train/${lastTrainPaper.id}`}
                        className="mt-1 ml-7 flex items-center justify-between gap-1.5 rounded-md border border-border/70 bg-card/70 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        title={
                          lastTrainPaper.title
                            ? `Resume ${lastTrainPaper.title}`
                            : "Resume last Train! paper"
                        }
                      >
                        <span className="truncate">Resume Paper</span>
                        <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
                      </Link>
                    )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Group 2: My Library */}
        <div className={cn(isSidebarCollapsed && "pt-2 border-t border-sidebar-border")}>
          {!isSidebarCollapsed && (
            <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Library
            </div>
          )}
          <nav aria-label="My Library" className="flex flex-col gap-1">
            {LIBRARY_NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.match, item.exclude);
              const Icon = item.icon;
              const countText = getLibraryCount(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={
                    isSidebarCollapsed
                      ? countText
                        ? `${item.label} (${countText})`
                        : item.label
                      : undefined
                  }
                  aria-label={
                    isSidebarCollapsed
                      ? countText
                        ? `${item.label}, ${countText}`
                        : item.label
                      : undefined
                  }
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    isSidebarCollapsed
                      ? "justify-center size-10 mx-auto"
                      : "h-9 px-2.5 justify-between gap-2",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-primary/20 shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden="true"
                    />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </span>
                  {!isSidebarCollapsed && countText && (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-muted-foreground">
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
          <div className={cn(isSidebarCollapsed && "pt-2 border-t border-sidebar-border")}>
            {!isSidebarCollapsed && (
              <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-warning">
                Staff Studio
              </div>
            )}
            <nav aria-label="Staff Studio" className="flex flex-col gap-1">
              {visibleStaffItems.map((item) => {
                const active = isNavActive(pathname, item.match, item.exclude);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isSidebarCollapsed ? item.label : undefined}
                    aria-label={isSidebarCollapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      isSidebarCollapsed
                        ? "justify-center size-10 mx-auto"
                        : "h-9 px-2.5 gap-2.5",
                      active
                        ? "bg-warning/15 text-warning font-semibold border border-warning/30 shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-warning"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden="true"
                    />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer: Account Identity & Utilities */}
      <div className="shrink-0 border-t border-sidebar-border p-2.5">
        {isLoading ? (
          <div
            className={cn(
              "flex items-center gap-2.5 p-1.5",
              isSidebarCollapsed ? "flex-col" : "justify-between"
            )}
          >
            <Skeleton className="size-8 rounded-full shrink-0" />
            {!isSidebarCollapsed && (
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            )}
          </div>
        ) : !user ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size={isSidebarCollapsed ? "icon-sm" : "sm"}
              onClick={() => window.dispatchEvent(new CustomEvent("open-dev-tools"))}
              title="Switch Account"
              aria-label="Switch Account"
              className={cn(
                "border-dashed border-primary/50 text-primary hover:bg-primary/10",
                isSidebarCollapsed ? "mx-auto flex" : "w-full justify-start gap-2"
              )}
            >
              <UserCog className="size-4 shrink-0" aria-hidden="true" />
              {!isSidebarCollapsed && <span>Switch Account</span>}
            </Button>
            <div
              className={cn(
                "flex items-center",
                isSidebarCollapsed ? "justify-center" : "justify-between px-1"
              )}
            >
              <ThemeToggle />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-8",
                  },
                }}
              />
            </div>
          </div>
        ) : isSidebarCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href={`/users/${user.id}`}
              title={`${user.display_name} · View profile`}
              aria-label={`${user.display_name} profile`}
              className="rounded-full p-0.5 border border-border hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <Avatar size="sm">
                {user.image_url && (
                  <AvatarImage src={user.image_url} alt={user.display_name} />
                )}
                <AvatarFallback>{getUserInitials(user.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
            <Link
              href="/settings/profile"
              title="Profile Settings"
              aria-label="Profile Settings"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <Settings className="size-4" aria-hidden="true" />
            </Link>
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                },
              }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/75 p-2 transition-colors hover:border-primary/40 hover:bg-card">
              <Link
                href={`/users/${user.id}`}
                aria-label={`${user.display_name} profile`}
                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <Avatar size="sm">
                  {user.image_url && (
                    <AvatarImage src={user.image_url} alt={user.display_name} />
                  )}
                  <AvatarFallback>{getUserInitials(user.display_name)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/users/${user.id}`}
                  className="block truncate text-xs font-semibold text-foreground hover:text-primary transition-colors rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  {user.display_name}
                </Link>
                <div className="mt-0.5 flex items-center">
                  {isStaffRole(user.role) ? (
                    <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                      {user.role}
                    </Badge>
                  ) : (
                    <ContributorBadge tier={user.contributor_tier} size="sm" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 px-0.5">
              <Link
                href="/settings/profile"
                title="Profile Settings"
                aria-label="Profile Settings"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <Settings className="size-4" aria-hidden="true" />
              </Link>
              <ThemeToggle />
              <div className="flex size-9 items-center justify-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "size-8",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
