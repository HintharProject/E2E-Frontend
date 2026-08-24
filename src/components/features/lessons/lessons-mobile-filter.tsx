"use client";

import { MobileFilterToggle } from "@/components/layout/mobile-filter-toggle";
import { usePathname } from "next/navigation";

/** Mobile filter toggle pre-configured for the lessons pages. */
export function LessonsMobileFilterToggle() {
  const pathname = usePathname();
  const isManage = pathname === "/lessons/manage";

  return (
    <MobileFilterToggle
      showStateFilter={isManage}
    />
  );
}
