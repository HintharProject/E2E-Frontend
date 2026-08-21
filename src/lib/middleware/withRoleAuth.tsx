import React from "react";
// Scaffold: Application-level Middleware for Role-Based Access Control (RBAC)
// This sits inside the application logic layer, unlike proxy.ts which runs at the network edge.

export type Role = "Admin" | "Creator" | "Student";

export function withRoleAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: Role[]
) {
  return function RoleAuthWrapper(props: P) {
    // TODO: Implement actual user role retrieval logic here
    // Example: const { user } = useUser(); (Clerk) or Zustand store
    const userRole = "Student"; // Placeholder
    
    const isAuthorized = allowedRoles.includes(userRole as Role);

    if (!isAuthorized) {
      // TODO: Render Unauthorized UI or redirect to /dashboard
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50 text-center">
          <div className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-md border border-red-100">
            <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
            <p className="text-gray-600 text-sm">
              You do not have the required permissions to view this page.
              Requires: {allowedRoles.join(" or ")}
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
