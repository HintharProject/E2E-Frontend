"use client";

import { PrefetchingSubNav as SubNav } from "@/components/ui/prefetching-sub-nav";
import { useCurrentUser } from "@/hooks/use-current-user";

export function LessonsTabs() {
  const { user } = useCurrentUser();
  const showManage = !!user;

  const items = [
    { href: "/lessons", label: "All Lessons" },
  ];

  if (showManage) {
    items.push({ href: "/lessons/manage", label: "Manage Lessons" });
  }

  return (
    <div className="relative w-full">
      <SubNav items={items} variant="underline" />
    </div>
  );
}
