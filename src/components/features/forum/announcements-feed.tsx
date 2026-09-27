"use client";

import { useAnnouncements, type Announcement } from "@/hooks/use-announcements";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isModeratorOrAbove } from "@/types/user";
import { MathRenderer } from "@/components/ui/math-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import {
  Megaphone,
  Clock,
  Share2,
  Shield,
  ExternalLink,
  Loader2,
  Pin,
  Check,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

function AnnouncementCard({
  announcement,
  isStaff,
}: {
  announcement: Announcement;
  isStaff: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/forum/announcements#${announcement.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Announcement link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const author = announcement.author_details;

  // Remaining time calculation if expires_at is set
  const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null;
  const isExpiringSoon = expiresAt
    ? expiresAt.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 &&
      expiresAt.getTime() > Date.now()
    : false;

  return (
    <article
      id={announcement.id}
      className="group relative rounded-2xl border border-line bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-line/60">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 border-primary/25 text-primary font-bold text-xs px-2.5 py-0.5 gap-1.5 shadow-none">
            <Pin className="size-3 text-primary rotate-45" />
            Official Bulletin
          </Badge>

          {expiresAt && isExpiringSoon && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-xs gap-1 font-medium"
            >
              <Clock className="size-3 text-amber-500" />
              Expires Soon
            </Badge>
          )}

          {expiresAt && !isExpiringSoon && (
            <span className="text-[11px] text-ink-muted flex items-center gap-1">
              <Clock className="size-3" />
              Valid until {formatDate(announcement.expires_at!)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isStaff && (
            <Link href="/admin/announcements">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-ink-muted hover:text-ink hover:bg-muted"
                title="Manage announcements in admin panel"
              >
                <Shield className="size-3 text-primary mr-1" />
                Manage
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="h-7 px-2 text-xs text-ink-muted hover:text-ink hover:bg-muted"
            title="Share announcement link"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-500 mr-1" /> Copied
              </>
            ) : (
              <>
                <Share2 className="size-3 mr-1" /> Share
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Announcement Title */}
      <h2 className="text-xl font-black text-ink tracking-tight mb-3 leading-snug group-hover:text-primary transition-colors">
        {announcement.title}
      </h2>

      {/* Author Attribution */}
      <div className="flex items-center gap-3 mb-5">
        <Avatar className="size-8 border border-line">
          {author?.profile_image_url && <AvatarImage src={author.profile_image_url} />}
          <AvatarFallback className="text-xs font-bold bg-muted text-ink">
            {author?.display_name?.slice(0, 2).toUpperCase() || "AD"}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-bold text-ink">{author?.display_name || "Platform Admin"}</span>
          {author?.contributor_tier && (
            <ContributorBadge tier={author.contributor_tier} size="sm" />
          )}
          <span className="text-ink-muted">•</span>
          <span className="text-ink-muted">Published {formatDate(announcement.created_at)}</span>
        </div>
      </div>

      {/* Announcement Body Content */}
      <div className="rounded-xl border border-line/60 bg-muted/15 p-5 text-sm text-ink leading-relaxed font-sans">
        <MathRenderer content={announcement.body} />
      </div>
    </article>
  );
}

export function AnnouncementsFeed() {
  const { user: currentUser } = useCurrentUser();
  const isStaff = !!currentUser && isModeratorOrAbove(currentUser.role);

  // Fetch active, non-expired announcements for the user feed
  const { data: announcements = [], isLoading, isError, refetch } = useAnnouncements({
    active_only: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-card p-6 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-muted rounded-md" />
              <div className="h-5 w-20 bg-muted rounded-md" />
            </div>
            <div className="h-6 w-3/4 bg-muted rounded-md" />
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-muted" />
              <div className="h-4 w-40 bg-muted rounded-md" />
            </div>
            <div className="h-24 w-full bg-muted/60 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center space-y-3">
        <p className="text-sm font-bold text-destructive">Failed to load platform announcements</p>
        <p className="text-xs text-ink-muted">Please check your internet connection or try again.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
          Try Again
        </Button>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card p-12 text-center space-y-4 shadow-xs">
        <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
          <Megaphone className="size-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-bold text-ink">No Active Announcements</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            There are no broadcast announcements active at this time. Scheduled maintenance, exam cycle notices, and platform updates will be pinned here when published by platform staff.
          </p>
        </div>
        {isStaff && (
          <Link href="/admin/announcements">
            <Button size="sm" className="mt-2 font-semibold">
              <Shield className="size-3.5 mr-1.5" />
              Post Announcement in Admin
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          isStaff={isStaff}
        />
      ))}
    </div>
  );
}
