"use client";

import { UserProfile, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AccountSettingsPage() {
  const { isSignedIn } = useAuth();
  const [hasDevToken, setHasDevToken] = useState(false);

  useEffect(() => {
    setHasDevToken(Boolean(localStorage.getItem("dev_token")));
  }, []);

  if (!isSignedIn && hasDevToken) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center max-w-xl mx-auto">
        <h3 className="font-heading text-lg font-semibold text-ink">
          Development Account Active
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          You are currently signed in via a local development account. Clerk account security management
          (passwords, two-factor authentication, and connected accounts) is only available when signed in with a live Clerk account.
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <UserProfile 
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full max-w-4xl",
            card: "shadow-none border border-line bg-card w-full rounded-2xl",
            navbar: "hidden",
          }
        }}
      />
    </div>
  );
}
