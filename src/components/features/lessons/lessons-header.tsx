"use client";

import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LessonsHeader() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  
  const isAdmin = user?.role === "ADMIN";

  if (pathname === "/lessons/manage") {
    return (
      <PageHeader
        title={isAdmin ? "Manage all lessons" : "My lessons"}
        description={
          isAdmin 
            ? "Manage all Draft, Published, and Archived lessons across the platform." 
            : "Manage your Draft, Published, and Archived lessons."
        }
        actions={
          !isAdmin ? (
            <Button nativeButton={false} render={<Link href="/lessons/new" />}>
              New lesson
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <PageHeader
      title="Lessons"
      description="Explore published lessons. Filter by subject, level, and tags."
    />
  );
}
