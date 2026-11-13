"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import {
  Menu,
  Search,
  UserCog,
  Settings,
  ChevronDown,
  Shield,
  RefreshCw,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isNavActive } from "@/lib/constants";
import { useUIStore } from "@/lib/store/ui-store";
import { isWriteLocked, isStaffRole } from "@/types/user";
import { AppHeaderSkeleton } from "./app-header-skeleton";
import { MobileNav } from "./mobile-nav";
import { MobileFilterToggle } from "./mobile-filter-toggle";
import { LessonsMobileFilterToggle } from "@/components/features/lessons/lessons-mobile-filter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { ForumSubNav } from "@/components/features/forum/forum-sub-nav";
import { LessonsTabs } from "@/components/features/lessons/lessons-tabs";
import { useRefreshStore } from "@/lib/store/refresh-store";
import { cn } from "@/lib/utils";

/** Primary public learner tabs rendered in AppHeader. */
interface PrimaryTab {
  href: string;
  label: string;
  match: string;
  exclude?: string[];
}

const PRIMARY_TABS: PrimaryTab[] = [
  { href: "/forum", label: "Forum", match: "/forum" },
  { href: "/lessons", label: "Lessons", match: "/lessons", exclude: ["/lessons/new"] },
  { href: "/problems", label: "Solve!", match: "/problems" },
  { href: "/train", label: "Train!", match: "/train" },
  { href: "/resources", label: "Resources", match: "/resources" },
];

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const { toggleMobileNav, openCommandPalette } = useUIStore();
  const isMac =
    typeof navigator !== "undefined" &&
    /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent);

  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { isRefreshing, triggerRefresh } = useRefreshStore();

  useEffect(() => {
    if (!user || isLoading) return;

    const prefetchTabs = async () => {
      const token = await getToken();
      if (!token) return;

      // 1. Prefetch Profile
      queryClient.prefetchQuery({
        queryKey: ["currentUser"],
        queryFn: () => apiFetch("/users/me/", token),
      });

      // 2. Prefetch default Lessons Feed
      queryClient.prefetchInfiniteQuery({
        queryKey: ["lessons", { subject: "", level: "", tags: "", authorId: undefined, state: undefined }],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1 }) => apiFetch(`/lessons/?page=${pageParam}`, token),
      });

      // 3. Prefetch default Problems Feed
      queryClient.prefetchInfiniteQuery({
        queryKey: ["problems", { status: "OPEN", subject: "", level: "" }],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1 }) => apiFetch(`/problems/?status=OPEN&page=${pageParam}`, token),
      });

      // 4. Prefetch My Lessons
      if (user) {
        queryClient.prefetchInfiniteQuery({
          queryKey: ["lessons", { subject: "", level: "", tags: "", authorId: user.id, state: "PUBLISHED" }],
          initialPageParam: 1,
          queryFn: ({ pageParam = 1 }) => apiFetch(`/lessons/?author_id=${user.id}&state=PUBLISHED&page=${pageParam}`, token),
        });
      }
    };

    prefetchTabs();
  }, [user, isLoading, getToken, queryClient]);

  const [showSuccess, setShowSuccess] = useState(false);
  const wasRefreshing = useRef(isRefreshing);

  useEffect(() => {
    if (wasRefreshing.current && !isRefreshing) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
    wasRefreshing.current = isRefreshing;
  }, [isRefreshing]);

  // Show skeleton while user data loads (handles cold starts gracefully)
  if (isLoading) {
    return <AppHeaderSkeleton />;
  }

  const writeLocked = user ? isWriteLocked(user.ban_state) : false;
  const isCollectionsActive = pathname.startsWith("/study-plans") || pathname.startsWith("/saved-sessions");
  const isStaff = user ? isStaffRole(user.role) : false;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const isStaffActive = pathname.startsWith("/admin");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        {/* Ban state banners */}
        {writeLocked && (
          <div className="bg-destructive px-4 py-2 text-center text-sm font-semibold text-destructive-foreground">
            Read-only mode — your account is restricted ({user?.ban_state}).
            You can browse but cannot post, vote, or edit.
          </div>
        )}
        {user?.ban_state === "WARNING" && (
          <div className="bg-accent px-4 py-1.5 text-center text-xs font-semibold text-accent-foreground">
            Account warning on file — please follow community guidelines.
          </div>
        )}

        {/* Primary 64px Header Bar */}
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          {/* Left section: Brand + Primary Navigation */}
          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
            {/* Mobile hamburger (min 44px touch) */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-11 rounded-lg shrink-0"
              onClick={toggleMobileNav}
              aria-label="Open mobile navigation"
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>

            {/* Logo */}
            <Link
              href="/forum"
              className="flex items-center gap-2 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="font-heading text-2xl font-bold tracking-tight text-primary">
                E2E
              </span>
            </Link>

            {/* Desktop Navigation Pills */}
            <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1 min-w-0">
              {PRIMARY_TABS.map((item) => {
                const active = isNavActive(pathname, item.match, item.exclude);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-2.5 lg:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      active
                        ? "bg-primary/15 text-primary border border-primary/25 font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Collections Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2.5 lg:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isCollectionsActive
                      ? "bg-primary/15 text-primary border border-primary/25 font-semibold shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span>Collections</span>
                  <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    onClick={() => router.push("/study-plans")}
                    className="cursor-pointer"
                  >
                    Study Plans
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/saved-sessions")}
                    className="cursor-pointer"
                  >
                    Saved Sessions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Staff Navigation Separator & Dropdown */}
              {isStaff && (
                <>
                  <div className="h-4 w-px bg-border mx-1 shrink-0" />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer select-none",
                        isStaffActive
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold shadow-2xs"
                          : "border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <Shield className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Staff</span>
                      <ChevronDown className="size-3 opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuItem
                        onClick={() => router.push("/admin/reports")}
                        className="cursor-pointer"
                      >
                        Moderation Reports
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() => router.push("/admin")}
                          className="cursor-pointer"
                        >
                          Admin Dashboard
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </nav>
          </div>

          {/* Center/Right Section: Search Trigger + User Utilities */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop global search trigger button with ⌘K badge */}
            <button
              type="button"
              onClick={openCommandPalette}
              className="hidden md:flex items-center justify-between h-9 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 px-3 text-xs text-muted-foreground transition-colors cursor-pointer group min-w-[140px] max-w-[200px] lg:max-w-[240px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Open search command palette"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Search className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                <span className="font-normal truncate">
                  Search platform...
                </span>
              </span>
              <kbd suppressHydrationWarning className="inline-flex shrink-0 items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground group-hover:text-foreground shadow-2xs">
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </button>

            {/* Mobile search trigger icon button */}
            <button
              type="button"
              onClick={openCommandPalette}
              className="md:hidden flex size-11 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Open search"
            >
              <Search className="size-4" aria-hidden="true" />
            </button>

            {/* Cold Start Refresh Button */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => triggerRefresh()}
                disabled={isRefreshing}
                className="size-11 md:size-9 md:min-h-0 md:min-w-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer relative"
                title={isRefreshing ? "Refreshing feed..." : showSuccess ? "Refreshed!" : "Refresh feed"}
                aria-label="Refresh feed"
              >
                {isRefreshing ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : showSuccess ? (
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile / Dev switch / Avatar */}
            {!user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("open-dev-tools"))}
                className="h-8 gap-1.5 text-xs font-semibold border-dashed border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <UserCog className="size-3.5" />
                <span className="hidden sm:inline">Switch Account</span>
              </Button>
            ) : (
              <>
                <Link
                  href={`/users/${user.id}`}
                  className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-background py-0.5 pl-0.5 pr-2.5 transition-colors hover:border-primary/40 shadow-2xs"
                >
                  <Avatar size="sm">
                    {user.image_url && (
                      <AvatarImage src={user.image_url} alt={user.display_name} />
                    )}
                    <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
                    {user.display_name}
                  </span>
                  {isStaffRole(user.role) ? (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                      {user.role}
                    </Badge>
                  ) : (
                    <ContributorBadge tier={user.contributor_tier} size="sm" />
                  )}
                </Link>

                <Link
                  href="/settings/profile"
                  title="Profile Settings"
                  aria-label="Profile Settings"
                  className="hidden sm:flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Settings className="size-4" />
                </Link>
              </>
            )}

            {/* Clerk User Button */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8 sm:size-9",
                },
              }}
            />
          </div>
        </div>

        {/* Secondary SubNav Row — For routes that have sub-sections (Forum, Lessons) */}
        {(pathname.startsWith("/forum") || pathname.startsWith("/lessons")) && (
          <div className="border-t border-border/60 bg-muted/20">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 sm:px-6">
              <div className="flex-1 overflow-x-auto min-w-0 scrollbar-none">
                {pathname.startsWith("/forum") && (
                  <ForumSubNav activeHref={pathname} />
                )}
                {pathname.startsWith("/lessons") && (
                  <LessonsTabs />
                )}
              </div>
              <div className="ml-3 shrink-0 lg:hidden">
                <AppHeaderMobileFilter pathname={pathname} />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filter Row — For pages with filters outside of Forum/Lessons (Problems, Resources, Train) */}
        {(!pathname.startsWith("/forum") && !pathname.startsWith("/lessons") && (pathname.startsWith("/problems") || pathname.startsWith("/resources") || pathname === "/train")) && (
          <div className="border-t border-border/60 bg-muted/20 lg:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 sm:px-6">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {pathname.startsWith("/problems") ? "Solve! Filters" : pathname.startsWith("/resources") ? "Resources Filters" : "Paper Filters"}
              </span>
              <AppHeaderMobileFilter pathname={pathname} />
            </div>
          </div>
        )}
      </header>

      {/* Mobile navigation overlay */}
      <MobileNav user={user} />
    </>
  );
}

function AppHeaderMobileFilter({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/forum")) {
    return <MobileFilterToggle showPostType={true} />;
  }
  if (pathname.startsWith("/lessons")) {
    return <LessonsMobileFilterToggle />;
  }
  if (pathname.startsWith("/problems")) {
    return <MobileFilterToggle hideTags={true} showProblemStatus={true} />;
  }
  if (pathname.startsWith("/resources") || pathname === "/train") {
    return <MobileFilterToggle hideTags={true} />;
  }
  return null;
}
