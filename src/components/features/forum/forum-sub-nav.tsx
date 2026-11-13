"use client";

import { usePathname } from "next/navigation";
import { PrefetchingSubNav as SubNav } from "@/components/ui/prefetching-sub-nav";
import type { FilterSidebarProps } from "@/components/layout/filter-sidebar";

const FORUM_ITEMS = [
  { href: "/forum", label: "Main Feed" },
  { href: "/forum/announcements", label: "Announcements" },
  { href: "/forum/creators", label: "Followed Creators" },
] as const;

/**
 * Forum sub-nav with segmented tabs.
 */
export function ForumSubNav({
  activeHref,
}: {
  activeHref?: string;
  filterProps?: FilterSidebarProps;
}) {
  const pathname = usePathname();
  const current = activeHref ?? pathname;

  const items = FORUM_ITEMS.map((item) => ({
    ...item,
    active: item.href === current,
  }));

  return (
    <div className="relative w-full">
      <SubNav items={items} variant="underline" />
    </div>
  );
}
