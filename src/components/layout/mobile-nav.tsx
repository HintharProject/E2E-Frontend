"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, BookOpen, MessageSquare, GraduationCap, Compass, FolderKanban, Bookmark, Clock, Shield, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { isNavActive } from "@/lib/constants";
import { useUIStore } from "@/lib/store/ui-store";
import { isStaffRole, type AppUser } from "@/types/user";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  user: AppUser | null;
}

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

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav } = useUIStore();

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  if (!isMobileNavOpen) return null;

  const publicFeeds = [
    { href: "/forum", label: "Forum", icon: MessageSquare, match: "/forum" },
    { href: "/lessons", label: "Lessons", icon: BookOpen, match: "/lessons", exclude: ["/lessons/new"] },
    { href: "/problems", label: "Solve!", icon: GraduationCap, match: "/problems" },
    { href: "/train", label: "Train!", icon: Compass, match: "/train" },
    { href: "/resources", label: "Resources", icon: FolderKanban, match: "/resources" },
  ];

  const collections = [
    { href: "/study-plans", label: "Study Plans", icon: Bookmark, match: "/study-plans" },
    { href: "/saved-sessions", label: "Saved Sessions", icon: Clock, match: "/saved-sessions" },
  ];

  const hasStaffRole = user ? isStaffRole(user.role) : false;
  const isAdminRole = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Slide-over panel from left */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col border-r border-border bg-background shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            href="/forum"
            onClick={closeMobileNav}
            className="flex items-center gap-2"
          >
            <span className="font-heading text-xl font-bold tracking-tight text-primary">
              E2E
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Hinthar Education
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileNav}
            className="size-11 rounded-lg"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Scrollable Nav Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {/* User Profile Card */}
          {user ? (
            <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  {user.image_url && (
                    <AvatarImage src={user.image_url} alt={user.display_name} />
                  )}
                  <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {user.display_name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {hasStaffRole ? (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                        {user.role}
                      </Badge>
                    ) : (
                      <ContributorBadge tier={user.contributor_tier} size="sm" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/50">
                <Link
                  href={`/users/${user.id}`}
                  onClick={closeMobileNav}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/settings/profile"
                  onClick={closeMobileNav}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="size-3.5 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-2">Sign in to unlock personalized study tracks</p>
              <Button
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

          {/* Group 1: Public Feeds */}
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Explore Feeds
            </div>
            <nav className="flex flex-col gap-1">
              {publicFeeds.map((item) => {
                const active = isNavActive(pathname, item.match, item.exclude);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNav}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary border border-primary/25 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Group 2: Collections */}
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Collections
            </div>
            <nav className="flex flex-col gap-1">
              {collections.map((item) => {
                const active = isNavActive(pathname, item.match);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNav}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary border border-primary/25 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Group 3: Staff Management (if staff) */}
          {hasStaffRole && (
            <div>
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Staff Moderation
              </div>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/admin/reports"
                  onClick={closeMobileNav}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/admin/reports") || pathname.startsWith("/moderation")
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Shield className="size-4 shrink-0" />
                  <span>Moderation Reports</span>
                </Link>
                {isAdminRole && (
                  <Link
                    href="/admin"
                    onClick={closeMobileNav}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/admin"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Shield className="size-4 shrink-0" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
