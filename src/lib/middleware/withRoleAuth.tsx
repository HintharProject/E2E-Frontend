"use client";

import React from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/types/user";

// ---------------------------------------------------------------------------
// Application-level Middleware for Role-Based Access Control (RBAC)
// This sits inside the application logic layer, unlike proxy.ts which runs
// at the network edge.
//
// Per AGENTS.md §6:
//   proxy.ts → Pure network boundary (Clerk auth, edge redirects)
//   lib/middleware/ → RBAC, data validation, deeper business logic
// ---------------------------------------------------------------------------

export type { Role };

/**
 * Higher-Order Component that restricts rendering based on the user's role.
 * If the user's role is not in `allowedRoles`, an "Access Denied" UI is shown.
 * While the user profile is loading, a skeleton placeholder is displayed.
 *
 * @example
 * ```tsx
 * const AdminPage = withRoleAuth(AdminDashboard, ["ADMIN"]);
 * const CreatorPage = withRoleAuth(LessonManager, ["CREATOR", "ADMIN"]);
 * ```
 */
export function withRoleAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: Role[]
) {
  return function RoleAuthWrapper(props: P) {
    const { user, isLoading } = useCurrentUser();

    if (isLoading) {
      return <RoleAuthSkeleton />;
    }

    if (!user || !allowedRoles.includes(user.role)) {
      return <AccessDenied allowedRoles={allowedRoles} />;
    }

    return <WrappedComponent {...props} />;
  };
}

function RoleAuthSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border p-6">
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto h-4 w-60" />
      </div>
    </div>
  );
}

function AccessDenied({ allowedRoles }: { allowedRoles: Role[] }) {
  return (
    <div className="flex h-64 items-center justify-center text-center">
      <div className="max-w-md space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You do not have the required permissions to view this page.
          <br />
          Requires: {allowedRoles.join(" or ")}
        </p>
      </div>
    </div>
  );
}
