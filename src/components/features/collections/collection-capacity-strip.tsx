"use client";

import Link from "next/link";
import { AlertCircle, BookMarked, Layers } from "lucide-react";
import { MAX_STUDY_PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface CollectionSlotSummary {
  id: string;
  title: string;
  item_count?: number;
}

export interface CollectionCapacityStripProps {
  label: "Study Plans" | "Saved Sessions";
  singularLabel: string;
  basePath: "/study-plans" | "/saved-sessions";
  collections: CollectionSlotSummary[];
  maxSlots?: number;
  hasEmpty: boolean;
  atCap: boolean;
}

export function CollectionCapacityStrip({
  label,
  singularLabel,
  basePath,
  collections,
  maxSlots = MAX_STUDY_PLANS,
  hasEmpty,
  atCap,
}: CollectionCapacityStripProps) {
  const remaining = Math.max(0, maxSlots - collections.length);

  return (
    <section
      aria-label={`${label} capacity overview`}
      className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="size-4 text-primary shrink-0" />
          <h2 className="font-heading text-sm font-semibold text-foreground tracking-tight">
            {label} Capacity
          </h2>
        </div>

        <span
          className={cn(
            "font-mono tabular-nums text-xs font-semibold px-2.5 py-0.5 rounded-full border",
            atCap
              ? "border-warning/40 bg-warning/10 text-warning"
              : "border-border bg-muted/50 text-foreground"
          )}
        >
          {collections.length} / {maxSlots} slots used
        </span>
      </div>

      {/* 12-Slot Visual Meter */}
      <div className="space-y-2">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${maxSlots}, minmax(0, 1fr))` }}
          aria-hidden="true"
        >
          {Array.from({ length: maxSlots }, (_, idx) => {
            const occupied = idx < collections.length;
            return (
              <span
                key={`slot-segment-${idx}`}
                className={cn(
                  "h-2 rounded-full transition-colors",
                  occupied ? "bg-primary" : "bg-muted"
                )}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {atCap
            ? `All ${maxSlots} slots are currently in use. Delete an existing ${singularLabel} to free a slot.`
            : `${remaining} ${remaining === 1 ? "slot" : "slots"} available.`}
        </p>
      </div>

      {collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {collections.map((item) => {
            const count = item.item_count ?? 0;
            return (
              <Link
                key={item.id}
                href={`${basePath}/${item.id}`}
                className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/35 px-3 py-2.5 text-xs transition-colors hover:border-primary/40 hover:bg-muted/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookMarked className="size-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-[11px] text-muted-foreground shrink-0">
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {hasEmpty && !atCap && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-foreground">
          <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            You currently have an empty {singularLabel}. Add at least one item to it before opening another slot.
          </p>
        </div>
      )}
    </section>
  );
}

