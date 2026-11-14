"use client";

import Link from "next/link";
import { Megaphone, Plus, MessageSquareText, BookOpenText, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnouncements } from "@/hooks/use-announcements";
import { formatDate } from "@/lib/utils";

export function ForumRightRail() {
  const { data: announcementsData, isLoading } = useAnnouncements({ active_only: true });
  const latestAnnouncements = (announcementsData ?? []).slice(0, 3);

  return (
    <aside aria-label="Forum composer and announcements" className="hidden xl:block w-72 shrink-0 space-y-4">
      {/* Quick Post Composer CTA Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="space-y-1">
          <h2 className="font-heading text-base font-semibold text-foreground tracking-tight">
            Start a Discussion
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ask a quick peer question or share study notes (live for{" "}
            <span className="font-mono tabular-nums font-semibold text-foreground">30</span> days).
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            className="w-full justify-start gap-2"
            nativeButton={false}
            render={<Link href="/posts/new" />}
          >
            <Plus className="size-4" />
            Create Forum Post
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start gap-2"
            nativeButton={false}
            render={<Link href="/problems/new" />}
          >
            <HelpCircle className="size-4 text-primary" />
            Ask Problem in Solve!
          </Button>
        </div>
      </div>

      {/* Latest Institutional Announcements Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-warning" />
            <h2 className="font-heading text-sm font-semibold text-foreground tracking-tight">
              Institutional Notices
            </h2>
          </div>
          <Link
            href="/forum/announcements"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            All
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            <div className="h-14 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-14 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        ) : latestAnnouncements.length === 0 ? (
          <p className="text-xs text-muted-foreground leading-relaxed py-2">
            No active notices right now. Check back for exam schedule or platform updates.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {latestAnnouncements.map((item) => (
              <li key={item.id}>
                <Link
                  href="/forum/announcements"
                  className="block rounded-lg border border-border/70 bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(item.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Post Format Key */}
      <div className="rounded-xl border border-border bg-card/70 p-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-3.5 text-primary shrink-0" />
          <span>
            <strong className="text-foreground font-medium">Question</strong> — Peer Q&amp;A &amp; exam doubts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpenText className="size-3.5 text-warning shrink-0" />
          <span>
            <strong className="text-foreground font-medium">Sharing</strong> — Cheat sheets &amp; revision notes
          </span>
        </div>
      </div>
    </aside>
  );
}
