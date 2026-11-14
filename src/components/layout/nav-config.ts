import type { LucideIcon } from "lucide-react";
import {
  Home,
  Lightbulb,
  BookOpen,
  MessageSquare,
  FolderKanban,
  Bookmark,
  Clock,
  ShieldAlert,
  Shield,
} from "lucide-react";

export interface ShellNavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  match: string | string[];
  exclude?: string[];
  libraryKey?: "plans" | "sessions";
  adminOnly?: boolean;
}

export const WORKSPACE_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: "/",
  },
  {
    href: "/problems",
    label: "Solve!",
    icon: Lightbulb,
    match: "/problems",
    exclude: ["/problems/new"],
  },
  {
    href: "/lessons",
    label: "Lessons",
    icon: BookOpen,
    match: "/lessons",
    exclude: ["/lessons/new"],
  },
  {
    href: "/forum",
    label: "Forum",
    icon: MessageSquare,
    match: ["/forum", "/posts"],
    exclude: ["/posts/new"],
  },
  {
    href: "/resources",
    label: "Exams & Resources",
    shortLabel: "Resources",
    icon: FolderKanban,
    match: ["/resources", "/train"],
  },
];

export const LIBRARY_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/study-plans",
    label: "Study Plans",
    icon: Bookmark,
    match: "/study-plans",
    libraryKey: "plans",
  },
  {
    href: "/saved-sessions",
    label: "Saved Sessions",
    icon: Clock,
    match: "/saved-sessions",
    libraryKey: "sessions",
  },
];

export const STAFF_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/admin/reports",
    label: "Moderation",
    icon: ShieldAlert,
    match: ["/admin/reports", "/moderation", "/admin/tags", "/admin/triage"],
  },
  {
    href: "/admin",
    label: "Admin Studio",
    icon: Shield,
    match: "/admin",
    exclude: ["/admin/reports", "/admin/tags", "/admin/triage"],
    adminOnly: true,
  },
];

export const MOBILE_BOTTOM_NAV_ITEMS: ShellNavItem[] = WORKSPACE_NAV_ITEMS;

export interface RouteContext {
  parent?: { label: string; href: string };
  title: string;
}

export function getRouteContext(pathname: string): RouteContext {
  if (pathname === "/") return { title: "Academic Hub" };

  if (pathname === "/problems") return { title: "Solve! Problems" };
  if (pathname === "/problems/new") {
    return { parent: { label: "Solve!", href: "/problems" }, title: "Ask Problem" };
  }
  if (/^\/problems\/[^/]+\/solutions\/[^/]+\/edit/.test(pathname)) {
    return { parent: { label: "Solve!", href: "/problems" }, title: "Edit Solution" };
  }
  if (/^\/problems\/[^/]+\/solutions\/[^/]+/.test(pathname)) {
    return { parent: { label: "Solve!", href: "/problems" }, title: "Solution" };
  }
  if (/^\/problems\/[^/]+\/edit/.test(pathname)) {
    return { parent: { label: "Solve!", href: "/problems" }, title: "Edit Problem" };
  }
  if (pathname.startsWith("/problems/")) {
    return { parent: { label: "Solve!", href: "/problems" }, title: "Problem Detail" };
  }

  if (pathname === "/lessons") return { title: "Lessons Catalog" };
  if (pathname === "/lessons/manage") {
    return { parent: { label: "Lessons", href: "/lessons" }, title: "Manage Lessons" };
  }
  if (pathname === "/lessons/new") {
    return { parent: { label: "Lessons", href: "/lessons" }, title: "Write Lesson" };
  }
  if (/^\/lessons\/[^/]+\/edit/.test(pathname)) {
    return { parent: { label: "Lessons", href: "/lessons" }, title: "Edit Lesson" };
  }
  if (pathname.startsWith("/lessons/")) {
    return { parent: { label: "Lessons", href: "/lessons" }, title: "Lesson Reader" };
  }

  if (pathname === "/forum") return { title: "Community Forum" };
  if (pathname === "/forum/announcements") {
    return { parent: { label: "Forum", href: "/forum" }, title: "Announcements" };
  }
  if (pathname === "/forum/creators") {
    return { parent: { label: "Forum", href: "/forum" }, title: "Followed Creators" };
  }
  if (pathname === "/posts/new") {
    return { parent: { label: "Forum", href: "/forum" }, title: "New Post" };
  }
  if (/^\/posts\/[^/]+\/edit/.test(pathname)) {
    return { parent: { label: "Forum", href: "/forum" }, title: "Edit Post" };
  }
  if (pathname.startsWith("/posts/")) {
    return { parent: { label: "Forum", href: "/forum" }, title: "Discussion" };
  }

  if (pathname.startsWith("/resources") || pathname === "/train") {
    return { title: "Exams & Resources" };
  }

  if (pathname === "/study-plans") {
    return { parent: { label: "My Library", href: "/study-plans" }, title: "Study Plans" };
  }
  if (pathname === "/study-plans/new") {
    return { parent: { label: "Study Plans", href: "/study-plans" }, title: "New Plan" };
  }
  if (pathname.startsWith("/study-plans/")) {
    return { parent: { label: "Study Plans", href: "/study-plans" }, title: "Study Plan" };
  }

  if (pathname === "/saved-sessions") {
    return { parent: { label: "My Library", href: "/saved-sessions" }, title: "Saved Sessions" };
  }
  if (pathname === "/saved-sessions/new") {
    return { parent: { label: "Saved Sessions", href: "/saved-sessions" }, title: "New Session" };
  }
  if (pathname.startsWith("/saved-sessions/")) {
    return { parent: { label: "Saved Sessions", href: "/saved-sessions" }, title: "Saved Session" };
  }

  if (pathname.startsWith("/users/")) return { title: "Scholar Dossier" };
  if (pathname === "/settings/account") {
    return { parent: { label: "Settings", href: "/settings/profile" }, title: "Account" };
  }
  if (pathname.startsWith("/settings")) {
    return { parent: { label: "Settings", href: "/settings/profile" }, title: "Profile" };
  }
  if (pathname.startsWith("/search")) return { title: "Search" };
  if (pathname.startsWith("/tags/")) {
    return { parent: { label: "Explore", href: "/forum" }, title: "Topic Tag" };
  }

  if (pathname.startsWith("/admin/reports") || pathname.startsWith("/moderation")) {
    return { parent: { label: "Staff Studio", href: "/admin/reports" }, title: "Moderation" };
  }
  if (pathname.startsWith("/admin/tags")) {
    return { parent: { label: "Staff Studio", href: "/admin/reports" }, title: "Tag Merge Studio" };
  }
  if (pathname.startsWith("/admin/triage")) {
    return { parent: { label: "Staff Studio", href: "/admin/reports" }, title: "Content Triage" };
  }
  if (pathname.startsWith("/admin/users")) {
    return { parent: { label: "Admin Studio", href: "/admin" }, title: "Users" };
  }
  if (pathname.startsWith("/admin/taxonomy")) {
    return { parent: { label: "Admin Studio", href: "/admin" }, title: "Taxonomy" };
  }
  if (pathname.startsWith("/admin/resources")) {
    return { parent: { label: "Admin Studio", href: "/admin" }, title: "Resources" };
  }
  if (pathname.startsWith("/admin/announcements")) {
    return { parent: { label: "Admin Studio", href: "/admin" }, title: "Announcements" };
  }
  if (pathname.startsWith("/admin/audit-logs")) {
    return { parent: { label: "Admin Studio", href: "/admin" }, title: "Audit Logs" };
  }
  if (pathname.startsWith("/admin")) {
    return { title: "Admin Studio" };
  }

  return { title: "Hinthar Education" };
}

export function getUserInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

