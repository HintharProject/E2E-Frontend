"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Lock, LogIn, UserPlus } from "lucide-react";
import { getDevTokenIfEnabled, useDevToken } from "@/lib/client-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";

export interface AuthGateOptions {
  /** Short title / action context shown in the dialog heading (e.g., "view peer solutions"). */
  actionLabel?: string;
  /** Optional explanation copy displayed below the heading. */
  description?: string;
  /** Target URL to return the user to after completing sign-up / log-in. */
  redirectUrl?: string;
}

interface AuthGateContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  openAuthGate: (options?: AuthGateOptions) => void;
  closeAuthGate: () => void;
  /**
   * Executes `onAuthed` immediately when signed in; otherwise opens the Auth Gate
   * dialog with the provided context and returns false.
   */
  requireAuth: (onAuthed?: () => void, options?: AuthGateOptions) => boolean;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error("useAuthGate must be used within an AuthGateProvider");
  }
  return ctx;
}

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AuthGateOptions>({});
  const devToken = useDevToken();

  const effectiveSignedIn = Boolean(isSignedIn || devToken);

  const currentRelativeUrl = useMemo(() => {
    if (!pathname) return "/";
    if (typeof window !== "undefined" && window.location.search) {
      return `${pathname}${window.location.search}`;
    }
    return pathname;
  }, [pathname]);

  const openAuthGate = useCallback((nextOptions: AuthGateOptions = {}) => {
    setOptions(nextOptions);
    setOpen(true);
  }, []);

  const closeAuthGate = useCallback(() => {
    setOpen(false);
  }, []);

  const requireAuth = useCallback(
    (onAuthed?: () => void, gateOptions?: AuthGateOptions): boolean => {
      if (isSignedIn || getDevTokenIfEnabled()) {
        onAuthed?.();
        return true;
      }
      openAuthGate(gateOptions);
      return false;
    },
    [isSignedIn, openAuthGate]
  );

  const targetRedirect = options.redirectUrl || currentRelativeUrl || "/";
  const encodedRedirect = encodeURIComponent(targetRedirect);
  const signUpHref = `/sign-up?redirect_url=${encodedRedirect}`;
  const signInHref = `/sign-in?redirect_url=${encodedRedirect}`;

  const value = useMemo<AuthGateContextValue>(
    () => ({
      isSignedIn: effectiveSignedIn,
      isLoaded,
      openAuthGate,
      closeAuthGate,
      requireAuth,
    }),
    [effectiveSignedIn, isLoaded, openAuthGate, closeAuthGate, requireAuth]
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-md sm:max-w-md p-6 rounded-2xl border border-border bg-card shadow-modal">
          <DialogHeader className="space-y-2.5 text-left pr-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Lock className="size-4.5" aria-hidden="true" />
            </div>
            <DialogTitle className="font-display text-2xl font-medium tracking-tight text-foreground leading-snug">
              {options.actionLabel
                ? `Sign in to ${options.actionLabel}`
                : "Sign up or log in to continue"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {options.description ||
                "Public readers can preview papers, problems, lessons, and threads. Join E2E for free to unlock full walkthroughs, community solutions, voting, saving, and study tools."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 rounded-xl border border-border bg-muted/35 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="font-semibold text-foreground">Included with your free E2E account:</div>
            <ul className="space-y-1 list-disc pl-4">
              <li>Inspect all 7-slot community solutions &amp; accepted consensus markers</li>
              <li>Open complete step-by-step Lessons &amp; all threaded Forum replies</li>
              <li>Vote, comment, save past papers to Study Sessions, and ask in Solve!</li>
            </ul>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <Link
              href={signUpHref}
              onClick={() => setOpen(false)}
              className={buttonVariants({
                variant: "default",
                className: "flex-1 min-h-[44px] text-sm font-semibold gap-1.5 justify-center",
              })}
            >
              <UserPlus className="size-4" aria-hidden="true" />
              <span>Sign up free</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Link
              href={signInHref}
              onClick={() => setOpen(false)}
              className={buttonVariants({
                variant: "outline",
                className: "flex-1 min-h-[44px] text-sm font-semibold gap-1.5 justify-center",
              })}
            >
              <LogIn className="size-4" aria-hidden="true" />
              <span>Log in</span>
            </Link>
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeAuthGate}
              className="text-xs text-muted-foreground min-h-[36px]"
            >
              Continue browsing public preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthGateContext.Provider>
  );
}
