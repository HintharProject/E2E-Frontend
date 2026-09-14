"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isAdminOrSuperAdmin } from "@/types/user";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !user) return;

    // Admin & staff bypass onboarding
    if (isAdminOrSuperAdmin(user.role)) return;

    // Check if user has completed profile setup (level or custom_level)
    const hasProfileSetup = Boolean(user.level || user.custom_level);
    const isDismissed =
      typeof window !== "undefined" &&
      localStorage.getItem("onboarding_dismissed") === "true";

    if (!hasProfileSetup && !isDismissed && !pathname?.startsWith("/onboarding")) {
      router.push("/onboarding/profile");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
