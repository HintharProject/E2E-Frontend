import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export interface BaseFeedCardProps {
  href: string;
  onMouseEnter?: () => void;
  author?: {
    id: string;
    display_name: string;
    profile_image_url?: string | null;
  };
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
      className={`group rounded-2xl border border-line bg-card p-5 transition hover:border-brand/35 hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)] relative ${className}`}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`}>
              <Avatar size="sm">
                {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
          <div>
            {author ? (
              <Link
                href={`/users/${author.id}`}
                className="text-sm font-semibold text-ink hover:text-brand-dark"
              >
                {author.display_name}
              </Link>
            ) : null}
            {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
          </div>
        </div>
        {topRight && <div className="flex items-center gap-2">{topRight}</div>}
      </div>
      <Link href={href} className="mt-3 block">
        <h2 className="font-display text-xl text-ink group-hover:text-brand-dark">
          {title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {stripHtml(body)}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {bottomLeft}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
          {bottomRight}
        </div>
      </div>
      {/* Three-dot more menu — absolutely positioned top-right corner */}
      {moreMenu && (
        <div className="absolute right-3 top-3">
          {moreMenu}
        </div>
      )}
    </article>
  );
}

export interface BaseDetailedCardProps {
  author?: {
    id: string;
    display_name: string;
    profile_image_url?: string | null;
  };
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
    <article className={`rounded-2xl border border-line bg-card p-6 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`} className="flex items-center gap-2">
              <Avatar size="sm">
                {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-ink hover:text-brand-dark">{author.display_name}</span>
                {authorSubtext && <span className="text-xs text-ink-muted">{authorSubtext}</span>}
              </div>
            </Link>
          ) : null}
          {badges && <div className="flex flex-wrap gap-2 items-center">{badges}</div>}
        </div>
        {topRight && <div>{topRight}</div>}
      </div>

      {mediaImages && (
        <div className="mt-6">
          {mediaImages}
        </div>
      )}

      <div className="mt-6 whitespace-pre-wrap text-ink leading-relaxed">
        {body}
      </div>

      {fileAttachments && (
        <div className="mt-8 flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Attachments</h3>
          <div className="flex flex-col gap-2">
            {fileAttachments}
          </div>
        </div>
      )}

      {interactions && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          {interactions}
        </div>
      )}
    </article>
  );
}
