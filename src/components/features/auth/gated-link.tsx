"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";
import { useAuthGate } from "./auth-gate-modal";

export interface GatedLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {
  /** Action label inserted into "Sign in to {actionLabel}". */
  actionLabel: string;
  /** Optional custom redirect URL after authentication (defaults to `href`). */
  redirectUrl?: string;
}

/**
 * Link wrapper that prompts unauthenticated visitors with the Auth Gate dialog
 * instead of navigating directly to member-only routes.
 */
export function GatedLink({
  href,
  actionLabel,
  redirectUrl,
  onClick,
  children,
  ...rest
}: GatedLinkProps) {
  const { requireAuth } = useAuthGate();
  const resolvedHref = typeof href === "string" ? href : href.pathname || "/";

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const ok = requireAuth(undefined, {
          actionLabel,
          redirectUrl: redirectUrl || resolvedHref,
        });
        if (!ok) {
          e.preventDefault();
        }
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}

