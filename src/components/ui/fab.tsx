"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, X, FileText, BookOpen, HelpCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isWriteLocked } from "@/types/user";

type FabOption = {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
};

export function GlobalFAB() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Don't render if user is write-locked or not loaded
  if (!user) return null;
  const writeLocked = isWriteLocked(user.ban_state);

  const role = user.role;

  // Build options based on role
  const options: FabOption[] = [];

  // Post — everyone who isn't write-locked
  if (!writeLocked) {
    options.push({
      label: "Post",
      href: "/posts/new",
      icon: <FileText className="h-4 w-4" />,
      description: "Share or ask in the forum",
    });
  }

  // Lesson — Creators only
  if (role === "CREATOR" && !writeLocked) {
    options.push({
      label: "Lesson",
      href: "/lessons/new",
      icon: <BookOpen className="h-4 w-4" />,
      description: "Write a new lesson",
    });
  }

  // Problem — Students only (not Creator, not Admin)
  if (role === "STUDENT" && !writeLocked) {
    options.push({
      label: "Problem",
      href: "/problems/new",
      icon: <HelpCircle className="h-4 w-4" />,
      description: "Post a problem for solutions",
    });
  }

  // Nothing to show — hide FAB entirely
  if (options.length === 0) return null;

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Options pop-up — visible when open */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-200 ${
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {options.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 rounded-full border border-line bg-card py-2.5 pl-4 pr-5 shadow-lg transition-all hover:border-brand/40 hover:shadow-[0_8px_30px_-12px_oklch(0.508_0.118_165.612_/_0.5)]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
              {opt.icon}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-ink">{opt.label}</span>
              <span className="text-[11px] text-ink-muted">{opt.description}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Create new content"}
        aria-expanded={open}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_30px_-8px_oklch(0.508_0.118_165.612_/_0.6)] transition-all duration-200 hover:scale-105 hover:shadow-[0_12px_40px_-8px_oklch(0.508_0.118_165.612_/_0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          open
            ? "bg-ink text-background rotate-45"
            : "bg-brand text-white"
        }`}
      >
        {open ? (
          <X className="h-6 w-6 transition-transform duration-200" />
        ) : (
          <Plus className="h-6 w-6 transition-transform duration-200" />
        )}
      </button>
    </div>
  );
}
