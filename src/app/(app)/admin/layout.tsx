"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Loader2,
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderTree,
  Megaphone,
  FileText,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";
import { cn } from "@/lib/utils";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Teacher Apps", href: "/admin/teacher-applications", icon: UserCheck },
    { name: "Moderation Queue", href: "/admin/reports/posts", activeMatch: "/admin/reports", icon: ShieldAlert },
    { name: "Taxonomy", href: "/admin/taxonomy", icon: FolderTree },
    { name: "Resources", href: "/admin/resources", icon: FolderTree },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  ];

  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <aside
          className={cn(
            "w-full shrink-0 md:sticky md:top-36 md:self-start transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-20",
            isCollapsed ? "md:w-16" : "md:w-64"
          )}
        >
          <div>
            {/* Header / Collapse Toggle */}
            <div
              className={cn(
                "mb-4 flex items-center h-9 transition-all duration-300",
                isCollapsed ? "justify-center px-0" : "justify-between px-2.5"
              )}
            >
              <h2
                className={cn(
                  "text-lg font-semibold text-ink transition-all duration-300 overflow-hidden whitespace-nowrap",
                  isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                )}
              >
                Admin Panel
              </h2>
              <button
                onClick={toggleCollapse}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden md:inline-flex size-8 items-center justify-center rounded-lg border border-line bg-card text-ink-muted hover:bg-muted hover:text-ink transition-colors active:scale-95 shrink-0 shadow-2xs"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="size-4 text-primary" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </button>
            </div>

            {/* Navigation items */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
              {navItems.map((item) => {
                const isActive = item.activeMatch
                  ? pathname.startsWith(item.activeMatch)
                  : pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap h-10 px-3 gap-3 overflow-hidden",
                      isCollapsed ? "md:justify-center md:px-0 md:size-10" : "w-full",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-ink-muted hover:bg-muted hover:text-ink"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span
                      className={cn(
                        "transition-all duration-300 overflow-hidden whitespace-nowrap",
                        isCollapsed ? "md:w-0 md:opacity-0 md:pointer-events-none" : "w-auto opacity-100"
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
