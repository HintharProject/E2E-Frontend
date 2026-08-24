"use client";

import { PrefetchingSubNav as SubNav } from "@/components/ui/prefetching-sub-nav";
import { MobileFilterToggle } from "@/components/layout/mobile-filter-toggle";
import type { FilterSidebarProps } from "@/components/layout/filter-sidebar";

const FORUM_ITEMS = [
  { href: "/forum", label: "Main" },
  { href: "/forum/announcements", label: "Announcements" },
  { href: "/forum/creators", label: "Creators" },
] as const;

/**
 * Forum sub-nav with sticky tabs + mobile filter toggle.
 * Pass the same filter props as FilterSidebar.
 */
export function ForumSubNav({
  activeHref,
  filterProps,
}: {
  activeHref: string;
  filterProps?: FilterSidebarProps;
}) {
  const items = FORUM_ITEMS.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));

  return (
    <div className="relative">
      <SubNav
        items={items}
        mobileExtra={filterProps ? <MobileFilterToggle {...filterProps} /> : undefined}
      />
    </div>
  );
}
