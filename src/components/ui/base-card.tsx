import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { ContributorTier } from "@/types/contribution";
import { cn } from "@/lib/utils";

export function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "");
}

export interface BaseFeedCardProps {
  href: string;
  onMouseEnter?: () => void;
  author?: {
    id: string;
    display_name: string;
    profile_image_url?: string | null;
    contributor_tier?: ContributorTier | number | null;
  };
  authorBadge?: React.ReactNode;
  subtitle?: React.ReactNode;
  topRight?: React.ReactNode;
  title: string;
  body: string;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
  className?: string;
  moreMenu?: React.ReactNode;
}

export function BaseFeedCard({
  href,
  onMouseEnter,
  author,
  authorBadge,
  subtitle,
  topRight,
  title,
  body,
  bottomLeft,
  bottomRight,
  className = "",
  moreMenu,
}: BaseFeedCardProps) {
  return (
    <article
      data-slot="base-feed-card"
      className={cn(
        "group relative rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover",
        className
      )}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`}>
              <Avatar size="sm">
                {author.profile_image_url && (
                  <AvatarImage src={author.profile_image_url} />
                )}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {author ? (
                <Link
                  href={`/users/${author.id}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {author.display_name}
                </Link>
              ) : null}
              {author ? (
                <ContributorBadge
                  tier={author.contributor_tier ?? 0}
                  size="sm"
                />
              ) : null}
              {authorBadge}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {topRight}
          {moreMenu}
        </div>
      </div>
      <Link href={href} className="mt-3 block">
        <h2 className="font-heading font-semibold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
          {title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {stripHtml(body)}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">{bottomLeft}</div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          {bottomRight}
        </div>
      </div>
    </article>
  );
}

export interface BaseDetailedCardProps {
  author?: {
    id: string;
    display_name: string;
    profile_image_url?: string | null;
    contributor_tier?: ContributorTier | number | null;
  };
  authorBadge?: React.ReactNode;
  authorSubtext?: React.ReactNode;
  badges?: React.ReactNode;
  topRight?: React.ReactNode;
  body: React.ReactNode;
  mediaImages?: React.ReactNode;
  fileAttachments?: React.ReactNode;
  interactions?: React.ReactNode;
  className?: string;
}

export function BaseDetailedCard({
  author,
  authorBadge,
  authorSubtext,
  badges,
  topRight,
  body,
  mediaImages,
  fileAttachments,
  interactions,
  className = "",
}: BaseDetailedCardProps) {
  return (
    <article
      data-slot="base-detailed-card"
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-card",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {author ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/users/${author.id}`}
                className="flex items-center gap-2 hover:opacity-85"
              >
                <Avatar size="sm">
                  {author.profile_image_url && (
                    <AvatarImage src={author.profile_image_url} />
                  )}
                  <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground hover:text-primary transition-colors">
                    {author.display_name}
                  </span>
                  {authorSubtext && (
                    <span className="text-xs text-muted-foreground">
                      {authorSubtext}
                    </span>
                  )}
                </div>
              </Link>
              <ContributorBadge
                tier={author.contributor_tier ?? 0}
                size="sm"
              />
              {authorBadge}
            </div>
          ) : null}
          {badges && <div className="flex flex-wrap gap-2 items-center">{badges}</div>}
        </div>
        {topRight && <div>{topRight}</div>}
      </div>

      {mediaImages && <div className="mt-6">{mediaImages}</div>}

      <div className="mt-6 whitespace-pre-wrap text-foreground leading-relaxed">
        {body}
      </div>

      {fileAttachments && (
        <div className="mt-8 flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attachments
          </h3>
          <div className="flex flex-col gap-2">{fileAttachments}</div>
        </div>
      )}

      {interactions && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/50 pt-4">
          {interactions}
        </div>
      )}
    </article>
  );
}
