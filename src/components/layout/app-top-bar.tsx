"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import {
  Menu,
  Search,
  RefreshCw,
  Loader2,
  Check,
  Plus,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUIStore } from "@/lib/store/ui-store";
import { useRefreshStore } from "@/lib/store/refresh-store";
import { isWriteLocked } from "@/types/user";
import { MobileNav } from "./mobile-nav";
import { getRouteContext } from "./nav-config";
import { cn } from "@/lib/utils";

function getContextualCreateConfig(pathname: string): {
  mode: "direct" | "menu";
  href?: string;
  label: string;
  shortLabel: string;
} {
  if (pathname.startsWith("/problems")) {
    return {
      mode: "direct",
      href: "/problems/new",
      label: "Ask Problem",
      shortLabel: "Ask",
    };
  }
  if (pathname.startsWith("/lessons")) {
    return {
      mode: "direct",
      href: "/lessons/new",
      label: "Write Lesson",
      shortLabel: "Lesson",
    };
  }
  if (pathname.startsWith("/forum") || pathname.startsWith("/posts")) {
    return {
      mode: "direct",
      href: "/posts/new",
      label: "New Post",
      shortLabel: "Post",
    };
  }
  return {
    mode: "menu",
    label: "Create",
    shortLabel: "Create",
  };
}

export function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const { toggleMobileNav, openCommandPalette } = useUIStore();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { isRefreshing, triggerRefresh } = useRefreshStore();

  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
  }, []);

  // Prefetch core datasets once user is ready
  useEffect(() => {
    if (!user || isLoading) return;

    const prefetchTabs = async () => {
      const token = await getToken();
      if (!token) return;

      queryClient.prefetchQuery({
        queryKey: ["currentUser"],
        queryFn: () => apiFetch("/users/me/", token),
      });

      queryClient.prefetchInfiniteQuery({
        queryKey: [
          "lessons",
          { subject: "", level: "", tags: "", authorId: undefined, state: undefined },
        ],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1 }) => apiFetch(`/lessons/?page=${pageParam}`, token),
      });

      queryClient.prefetchInfiniteQuery({
        queryKey: ["problems", { status: "OPEN", subject: "", level: "" }],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1 }) =>
          apiFetch(`/problems/?status=OPEN&page=${pageParam}`, token),
      });

      queryClient.prefetchInfiniteQuery({
        queryKey: [
          "lessons",
          { subject: "", level: "", tags: "", authorId: user.id, state: "PUBLISHED" },
        ],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1 }) =>
          apiFetch(`/lessons/?author_id=${user.id}&state=PUBLISHED&page=${pageParam}`, token),
      });
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

  const writeLocked = user ? isWriteLocked(user.ban_state) : false;
  const routeContext = getRouteContext(pathname);
  const createConfig = getContextualCreateConfig(pathname);
  const isAlreadyOnCreatePage =
    pathname === "/problems/new" ||
    pathname === "/lessons/new" ||
    pathname === "/posts/new";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        {/* Preserved Ban / Sanction Banners */}
        {writeLocked && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-center text-xs sm:text-sm font-semibold text-destructive-foreground"
          >
            <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Read-only mode — your account is restricted ({user?.ban_state}). You can
              browse but cannot post, vote, or edit.
            </span>
          </div>
        )}
        {!writeLocked && user?.ban_state === "WARNING" && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/15 px-4 py-1.5 text-center text-xs font-semibold text-foreground"
          >
            <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span>Account warning on file — please follow community guidelines.</span>
          </div>
        )}

        {/* Slim 56px Top Context Bar */}
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          {/* Left: Mobile drawer button + Dynamic Context Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-initial">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden size-11 rounded-lg shrink-0"
              onClick={toggleMobileNav}
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
              {routeContext.parent && (
                <>
                  <Link
                    href={routeContext.parent.href}
                    className="hidden sm:inline text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {routeContext.parent.label}
                  </Link>
                  <ChevronRight
                    className="hidden sm:inline size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                </>
              )}
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                {routeContext.title}
              </span>
            </nav>
          </div>

          {/* Center: Prominent Command Palette Search Bar */}
          <div className="hidden sm:flex flex-1 justify-center max-w-md px-2">
            <button
              type="button"
              onClick={openCommandPalette}
              className="group flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card/80 px-3 text-xs text-muted-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Open search command palette"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Search
                  className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                  aria-hidden="true"
                />
                <span className="truncate">Search problems, lessons, papers...</span>
              </span>
              <kbd
                suppressHydrationWarning
                className="inline-flex shrink-0 items-center rounded border border-border bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground group-hover:text-foreground"
              >
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </button>
          </div>

          {/* Right: Mobile Search + Refresh + Contextual Primary CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={openCommandPalette}
              className="sm:hidden size-11 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Search platform"
            >
              <Search className="size-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => triggerRefresh()}
              disabled={isRefreshing}
              className="size-11 md:size-9 md:min-h-0 md:min-w-0 rounded-lg text-muted-foreground hover:text-foreground"
              title={
                isRefreshing
                  ? "Refreshing feed..."
                  : showSuccess
                  ? "Refreshed!"
                  : "Refresh feed"
              }
              aria-label="Refresh feed"
            >
              {isRefreshing ? (
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
              ) : showSuccess ? (
                <Check
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
            </Button>

            {/* Contextual Primary CTA */}
            {user && !writeLocked && !isAlreadyOnCreatePage && (
              createConfig.mode === "direct" && createConfig.href ? (
                <Button
                  asChild
                  size="sm"
                  className="h-10 md:h-9 px-2.5 sm:px-3.5 gap-1.5 font-semibold shadow-2xs"
                >
                  <Link href={createConfig.href}>
                    <Plus className="size-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">{createConfig.label}</span>
                    <span className="sm:hidden">{createConfig.shortLabel}</span>
                  </Link>
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className={cn(
                      "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 sm:px-3.5 h-10 md:h-9 text-xs font-semibold text-primary-foreground shadow-2xs transition-all hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                  >
                    <Plus className="size-4 shrink-0" aria-hidden="true" />
                    <span>Create</span>
                    <ChevronDown className="size-3.5 opacity-80" aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-popover p-1.5">
                    <DropdownMenuItem
                      onClick={() => router.push("/problems/new")}
                      className="cursor-pointer py-2"
                    >
                      <Lightbulb className="size-4 text-primary" aria-hidden="true" />
                      <span>Ask Problem in Solve!</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/lessons/new")}
                      className="cursor-pointer py-2"
                    >
                      <BookOpen className="size-4 text-primary" aria-hidden="true" />
                      <span>Write a Lesson</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/posts/new")}
                      className="cursor-pointer py-2"
                    >
                      <MessageSquare className="size-4 text-primary" aria-hidden="true" />
                      <span>New Forum Post</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>
        </div>
      </header>

      <MobileNav user={user} />
    </>
  );
}
