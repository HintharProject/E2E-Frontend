"use client";

import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/ui/page-header";

export function LessonsHeader() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  
  const isAdmin = user?.role === "ADMIN";

  if (pathname === "/lessons/manage") {
    return (
      <PageHeader
        title={isAdmin ? "Manage all lessons" : "My lessons"}
      />
    );
  }

  return <PageHeader title="Lessons" />;
}
