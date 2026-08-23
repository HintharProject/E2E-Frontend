"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserButton } from "@clerk/nextjs";
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
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

          {/* Desktop navigation pills */}
          <nav className="hidden gap-1 overflow-x-auto pb-1 md:flex">
            {visibleNav.map((item) => {
              const active = isNavActive(pathname, item.match, item.exclude);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
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
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  pathname === `/users/${user.id}`
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Profile
              </Link>
            )}
          </nav>

          {/* Mobile search */}
          <form onSubmit={onSearch} className="md:hidden">
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
        </div>
      </header>

      {/* Mobile navigation overlay */}
      <MobileNav user={user} />
    </>
  );
}
