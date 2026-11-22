"use client";

import * as React from "react";
import { Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const POST_TTL_DAYS = 30;
export const POST_EXPIRATION_WARNING_DAYS = 5;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Computes whole days remaining before a post reaches the 30-day retention limit.
 */
export function daysUntilExpiration(createdAt: string): number {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return POST_TTL_DAYS;
  const expirationTime = createdTime + POST_TTL_DAYS * MS_PER_DAY;
  const diffDays = Math.ceil((expirationTime - Date.now()) / MS_PER_DAY);
  return Math.max(0, diffDays);
}

export interface PostExpirationBadgeProps {
  createdAt: string;
  showSeparator?: boolean;
  className?: string;
}

/**
 * Renders a warning badge only within the final 5 days before a post expires,
 * paired with an accessible popover explaining the 30-day removal policy.
 */
export function PostExpirationBadge({
  createdAt,
  showSeparator = false,
  className,
}: PostExpirationBadgeProps) {
  const expiresIn = daysUntilExpiration(createdAt);

  if (expiresIn > POST_EXPIRATION_WARNING_DAYS) {
    return null;
  }

  const label = expiresIn === 0 ? "Expires today" : `Expires in ${expiresIn}d`;

  return (
    <>
      {showSeparator && <span aria-hidden="true">·</span>}
      <Popover>
        <PopoverTrigger
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${label}. View 30-day post retention policy`}
          className={cn(
            "inline-flex items-center min-h-[44px] sm:min-h-0 -my-2.5 sm:my-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className
          )}
        >
          <Badge
            variant="warning"
            className="gap-1 font-mono tabular-nums cursor-pointer hover:bg-warning/15"
          >
            <Clock className="size-3 shrink-0" aria-hidden="true" />
            <span>{label}</span>
            <Info className="size-3 shrink-0 opacity-75" aria-hidden="true" />
          </Badge>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          onClick={(e) => e.stopPropagation()}
          className="w-72 p-3.5 text-xs leading-relaxed"
        >
          <p className="font-heading font-semibold text-foreground">
            Posts expire after 30 days
          </p>
          <p className="mt-1.5 text-muted-foreground">
            Forum posts—including comments and attachments—are permanently removed 30 days after posting.
          </p>
          <p className="mt-1.5 text-muted-foreground">
            <span className="font-medium text-foreground">
              Saving does not preserve access
            </span>{" "}
            after day 30; saved posts are removed from your collections too. Download files or copy notes you want to keep.
          </p>
        </PopoverContent>
      </Popover>
    </>
  );
}

