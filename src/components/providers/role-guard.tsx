"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
