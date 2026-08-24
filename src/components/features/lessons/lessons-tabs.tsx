"use client";

import { PrefetchingSubNav as SubNav } from "@/components/ui/prefetching-sub-nav";
import { useCurrentUser } from "@/hooks/use-current-user";

export function LessonsTabs() {
  const { user } = useCurrentUser();
  const showManage = user?.role === "CREATOR" || user?.role === "ADMIN";

  const items = [
    { href: "/lessons", label: "Feed" },
  ];

  if (showManage) {
    items.push({ href: "/lessons/manage", label: "Manage" });
  }

  return <SubNav items={items} />;
}
