"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_LINKS = [
  { href: "/problems", label: "Solve!" },
  { href: "/lessons", label: "Lessons" },
  { href: "/resources", label: "Exams & Resources" },
  { href: "/forum", label: "Forum" },
];

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex items-center justify-center rounded-md border border-primary/25 bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-primary">
            E2E
          </span>
          <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
            Hinthar Education
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors py-1"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          <Link
            href="/sign-in"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "hidden sm:inline-flex min-h-[40px] md:min-h-[38px] px-4 text-sm font-medium",
            })}
          >
            Log in
          </Link>

          <Link
            href="/sign-up"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "min-h-[44px] md:min-h-[38px] px-3.5 sm:px-4 text-sm font-semibold shadow-sm",
            })}
          >
            Sign up
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="size-11 md:hidden text-foreground"
          >
            {mobileMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 space-y-2 md:hidden">
          <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 flex gap-2">
            <Link
              href="/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className={buttonVariants({
                variant: "outline",
                className: "flex-1 min-h-[44px] justify-center font-semibold",
              })}
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMobileMenuOpen(false)}
              className={buttonVariants({
                variant: "default",
                className: "flex-1 min-h-[44px] justify-center font-semibold",
              })}
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

