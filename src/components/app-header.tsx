"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Avatar, Badge } from "@/components/ui";
import { useAppUser, useAuthSource } from "@/components/user-provider";
import { isWriteLocked } from "@/lib/types/user";

type NavItem = {
  href: string;
  label: string;
  match: string | string[];
  exclude?: string[];
  roles?: Array<"CREATOR" | "ADMIN">;
};

const primaryNav: NavItem[] = [
  { href: "/forum", label: "Forum", match: "/forum" },
  {
    href: "/lessons",
    label: "Lessons",
    match: "/lessons",
    exclude: ["/lessons/mine", "/lessons/new"],
  },
  {
    href: "/lessons/mine",
    label: "My Lessons",
    roles: ["CREATOR", "ADMIN"],
    match: "/lessons/mine",
  },
  {
    href: "/study-plans",
    label: "Collections",
    match: ["/study-plans", "/saved-sessions"],
  },
  { href: "/admin", label: "Admin", roles: ["ADMIN"], match: "/admin" },
];

function isActive(
  pathname: string,
  match: string | string[],
  exclude?: string[],
) {
  if (exclude?.some((e) => pathname === e || pathname.startsWith(e + "/"))) {
    return false;
  }
  const matches = Array.isArray(match) ? match : [match];
  return matches.some(
    (m) => pathname === m || pathname.startsWith(m + "/"),
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppUser();
  const authSource = useAuthSource();
  const [q, setQ] = useState("");
  const writeLocked = isWriteLocked(user.banState);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  const visibleNav = primaryNav.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role as "CREATOR" | "ADMIN");
  });

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-[#F5F8FB]/90 backdrop-blur-md">
      {writeLocked ? (
        <div className="bg-warning px-4 py-2 text-center text-sm font-semibold text-white">
          Read-only mode — your account is restricted ({user.banState}). You can
          browse but cannot post, vote, or edit.
        </div>
      ) : null}
      {user.banState === "WARNING" ? (
        <div className="bg-brand-soft px-4 py-1.5 text-center text-xs font-semibold text-brand-dark">
          Account warning on file — please follow community guidelines.
        </div>
      ) : null}
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/forum" className="shrink-0">
            <span className="font-display text-2xl font-semibold tracking-tight text-brand-dark">
              E2E
            </span>
          </Link>
          <form onSubmit={onSearch} className="hidden flex-1 md:block">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles…"
              className="w-full rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/users/${user.id}`}
              className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 hover:border-brand/40"
            >
              <Avatar src={user.imageUrl} name={user.displayName} size="sm" />
              <span className="hidden text-sm font-semibold sm:inline">
                {user.displayName}
              </span>
              <Badge tone="brand">{user.role}</Badge>
            </Link>
            {authSource !== "mock" ? (
              <ClerkUserMenu />
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-brand/40"
              >
                Sign out
              </Link>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {visibleNav.map((item) => {
            const active = isActive(pathname, item.match, item.exclude);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand text-white"
                    : "text-ink-muted hover:bg-white hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href={`/users/${user.id}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              pathname.startsWith("/users/")
                ? "bg-brand text-white"
                : "text-ink-muted hover:bg-white hover:text-ink"
            }`}
          >
            Profile
          </Link>
        </nav>
        <form onSubmit={onSearch} className="md:hidden">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles…"
            className="w-full rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand"
          />
        </form>
      </div>
    </header>
  );
}

function ClerkUserMenu() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "h-9 w-9",
        },
      }}
    />
  );
}
