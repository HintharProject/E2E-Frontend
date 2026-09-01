"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState, useEffect, useRef } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PRIMARY_NAV, isNavActive } from "@/lib/constants";
import { useUIStore } from "@/lib/store/ui-store";
import { isWriteLocked } from "@/types/user";
import { AppHeaderSkeleton } from "./app-header-skeleton";
import { MobileNav } from "./mobile-nav";
import { MobileFilterToggle } from "./mobile-filter-toggle";
import { LessonsMobileFilterToggle } from "@/components/features/lessons/lessons-mobile-filter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ForumSubNav } from "@/components/features/forum/forum-sub-nav";
import { LessonsTabs } from "@/components/features/lessons/lessons-tabs";
import { useRefreshStore } from "@/lib/store/refresh-store";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// AppHeader — Main sticky navigation
// Migrated from E2E-Proto/src/components/app-header.tsx
//
// Differences from prototype:
// - No mock mode logic (no role-switch select, no useAuthSource)
// - Uses useCurrentUser() TanStack Query hook instead of prototype's context
// - Uses Clerk's UserButton for account menu
// - Skeleton fallback during user data loading (cold start resilience)
// ---------------------------------------------------------------------------

/**
 * Returns the user's initials for the avatar fallback.
 */
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
  const { toggleMobileNav } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
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

      // 3. Prefetch My Lessons (if applicable)
      if (user.role === "TEACHER" || user.role === "SENIOR_STUDENT" || user.role === "ADMIN") {
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

  const visibleNav = PRIMARY_NAV.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

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

        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          {/* Top row: Logo + Search + User */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileNav}
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>

            {/* Logo */}
            <Link href="/forum" className="shrink-0">
              <span className="font-heading text-2xl font-semibold tracking-tight text-primary">
                E2E
              </span>
            </Link>

            {/* Desktop search */}
            <form onSubmit={onSearch} className="hidden flex-1 md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles…"
                  className="h-9 rounded-full pl-9"
                />
              </div>
            </form>

            {/* User area */}
            <div className="ml-auto flex items-center gap-2">
              {user && (
                <Link
                  href={`/users/${user.id}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 transition-colors hover:border-primary/40"
                >
                  <Avatar size="sm">
                    {user.image_url && (
                      <AvatarImage
                        src={user.image_url}
                        alt={user.display_name}
                      />
                    )}
                    <AvatarFallback>
                      {getInitials(user.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-semibold sm:inline">
                    {user.display_name}
                  </span>
                  <Badge
                    variant={
                      user.role === "ADMIN" ? "outline" : "default"
                    }
                  >
                    {user.role}
                  </Badge>
                </Link>
              )}
              <ThemeToggle />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
            </div>
          </div>

          {/* Navigation Pills and Refresh Block */}
          <div className="flex items-center justify-between gap-4 w-full">
            {/* Desktop navigation pills */}
            <nav className="hidden gap-2 overflow-x-auto md:flex">
              {visibleNav.map((item) => {
                const active = isNavActive(pathname, item.match, item.exclude);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {user && (
                <Link
                  href={`/users/${user.id}`}
                  className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                    pathname === `/users/${user.id}`
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  Profile
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {isRefreshing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span className="font-medium animate-pulse">Updating...</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <Check className="size-3.5 text-green-500" />
                    <span className="font-medium text-green-600 dark:text-green-400">Refreshed</span>
                  </>
                ) : (
                  <span className="hidden sm:inline-block">Up to date</span>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => triggerRefresh()}
                disabled={isRefreshing}
                className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 cursor-pointer"
                title="Refresh feed"
              >
                <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Mobile search & filter */}
          <div className="flex items-center gap-2 md:hidden">
            <form onSubmit={onSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles…"
                  className="h-9 rounded-full pl-9"
                />
              </div>
            </form>
            <AppHeaderMobileFilter pathname={pathname} />
          </div>

          {/* Sub Nav Row */}
          {(pathname.startsWith("/forum") || pathname.startsWith("/lessons")) && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex-1 overflow-x-auto min-w-0">
                {pathname.startsWith("/forum") && (
                  <ForumSubNav activeHref={pathname} />
                )}
                {pathname.startsWith("/lessons") && (
                  <LessonsTabs />
                )}
              </div>
            </div>
          )}
        </div>
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
  return null;
}
