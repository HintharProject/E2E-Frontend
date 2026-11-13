"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Check,
  X,
  Search,
  Hash,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ContentSortToggle } from "@/components/ui/content-sort-toggle";
import { useSubjects, useLevels, useTags } from "@/hooks/use-metadata";
import { parseFilterList, serializeFilterList } from "@/lib/filter-params";
import type { ContentSortMode, TimeframeFilter } from "@/types";
import { cn } from "@/lib/utils";

export interface HorizontalFilterBarProps {
  showPostType?: boolean;
  showStateFilter?: boolean;
  hideTags?: boolean;
  showProblemStatus?: boolean;
  postTypeOptions?: { value: string; label: string }[];
  /** Built-in URL-synced Default / Popular / Newest sort toggle in the right slot. */
  showSort?: boolean;
  /** Custom right-side slot (used if showSort is false or alongside extra controls). */
  sortSlot?: React.ReactNode;
  rightActions?: React.ReactNode;
  className?: string;
}

interface MultiFilterChipProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

function MultiFilterChip({
  label,
  options,
  selected,
  onToggle,
  onClear,
  searchable = false,
  searchPlaceholder = "Filter options...",
  isLoading = false,
  icon,
}: MultiFilterChipProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : options;

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  const buttonText =
    selected.length === 0
      ? label
      : selected.length === 1 && selectedLabels[0]
      ? `${label}: ${selectedLabels[0]}`
      : `${label} (${selected.length})`;

  const isActive = selected.length > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        className={cn(
          "inline-flex min-h-[44px] sm:min-h-[34px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap max-w-[200px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isActive
            ? "border-primary/40 bg-primary/10 text-primary font-semibold"
            : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
        )}
      >
        {icon}
        <span className="truncate">{buttonText}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-70 transition-transform duration-150",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-2">
        <div className="flex items-center justify-between px-1.5 pb-1.5 mb-1 border-b border-border/60">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {(searchable || options.length > 7) && (
          <div className="relative mb-2">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              sizeVariant="sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8 h-8 text-xs"
            />
          </div>
        )}

        <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No matching options.
            </p>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex min-h-[36px] cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors select-none",
                    checked
                      ? "bg-primary/10 text-foreground font-medium"
                      : "text-foreground hover:bg-muted/70"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(opt.value)}
                      className="size-3.5 shrink-0 rounded border-input accent-primary cursor-pointer"
                    />
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {checked && (
                    <Check
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SingleFilterChipProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  defaultValue?: string;
  onChange: (value: string) => void;
}

function SingleFilterChip({
  label,
  options,
  value,
  defaultValue = "",
  onChange,
}: SingleFilterChipProps) {
  const [open, setOpen] = useState(false);
  const activeOption = options.find((o) => o.value === value) ?? options[0];
  const isActive = value !== defaultValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          "inline-flex min-h-[44px] sm:min-h-[34px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isActive
            ? "border-primary/40 bg-primary/10 text-primary font-semibold"
            : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <span>
          {label}: {activeOption?.label ?? "All"}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-70 transition-transform duration-150",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 p-1.5">
        <div className="px-2 pb-1.5 mb-1 border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="space-y-0.5">
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors cursor-pointer",
                  selected
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-foreground hover:bg-muted/70"
                )}
              >
                <span>{opt.label}</span>
                {selected && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const PROBLEM_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "SOLVED", label: "Solved" },
  { value: "FINAL", label: "Verified Consensus" },
  { value: "CLOSED", label: "Closed" },
];

const LESSON_STATE_OPTIONS = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

export function HorizontalFilterBar({
  showPostType = false,
  showStateFilter = false,
  hideTags = false,
  showProblemStatus = false,
  postTypeOptions = [
    { value: "QUESTION", label: "Question" },
    { value: "SHARING", label: "Sharing" },
  ],
  showSort = false,
  sortSlot,
  rightActions,
  className,
}: HorizontalFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const isManagePage = pathname === "/lessons/manage";
  const effectiveShowStateFilter = showStateFilter || isManagePage;

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: levels = [], isLoading: levelsLoading } = useLevels();
  const { data: tags = [], isLoading: tagsLoading } = useTags();

  const selectedSubjects = parseFilterList(searchParams.get("subject"));
  const selectedLevels = parseFilterList(searchParams.get("level"));
  const selectedTypes = parseFilterList(searchParams.get("post_type"));
  const selectedTags = parseFilterList(searchParams.get("tags"));
  const selectedStatus = searchParams.get("status") || "";
  const selectedState = searchParams.get("state") || "PUBLISHED";

  const currentSort = (searchParams.get("sort") as ContentSortMode) || "default";
  const currentTimeframe = (searchParams.get("timeframe") as TimeframeFilter) || "all";

  const hasFilters =
    selectedSubjects.length > 0 ||
    selectedLevels.length > 0 ||
    (showPostType && selectedTypes.length > 0) ||
    (!hideTags && selectedTags.length > 0) ||
    (showProblemStatus && Boolean(selectedStatus)) ||
    (effectiveShowStateFilter && Boolean(searchParams.get("state")) && selectedState !== "PUBLISHED");

  function setListParam(key: string, values: string[]) {
    const next = new URLSearchParams(searchParams.toString());
    if (values.length > 0) next.set(key, serializeFilterList(values));
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleListValue(key: string, current: string[], value: string) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setListParam(key, next);
  }

  function setSingleParam(key: string, value: string, defaultValue = "") {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== defaultValue) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("subject");
    next.delete("level");
    next.delete("post_type");
    next.delete("tags");
    next.delete("status");
    if (effectiveShowStateFilter) next.delete("state");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const handleSortChange = (newSort: ContentSortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "default") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      window.history.replaceState(null, "", newUrl);
    });
  };

  const handleTimeframeChange = (newTf: TimeframeFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTf === "all") {
      params.delete("timeframe");
    } else {
      params.set("timeframe", newTf);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      window.history.replaceState(null, "", newUrl);
    });
  };

  // Build removable active filter pills
  const activePills: { key: string; label: string; onRemove: () => void }[] = [];

  for (const levelId of selectedLevels) {
    const found = levels.find((l) => l.id === levelId);
    activePills.push({
      key: `level-${levelId}`,
      label: found ? found.name : "Level",
      onRemove: () => toggleListValue("level", selectedLevels, levelId),
    });
  }

  for (const subjectId of selectedSubjects) {
    const found = subjects.find((s) => s.id === subjectId);
    activePills.push({
      key: `subject-${subjectId}`,
      label: found ? found.name : "Subject",
      onRemove: () => toggleListValue("subject", selectedSubjects, subjectId),
    });
  }

  if (showPostType) {
    for (const typeVal of selectedTypes) {
      const found = postTypeOptions.find((t) => t.value === typeVal);
      activePills.push({
        key: `type-${typeVal}`,
        label: found ? found.label : typeVal,
        onRemove: () => toggleListValue("post_type", selectedTypes, typeVal),
      });
    }
  }

  if (showProblemStatus && selectedStatus) {
    const found = PROBLEM_STATUS_OPTIONS.find((s) => s.value === selectedStatus);
    activePills.push({
      key: `status-${selectedStatus}`,
      label: found ? found.label : selectedStatus,
      onRemove: () => setSingleParam("status", ""),
    });
  }

  if (effectiveShowStateFilter && searchParams.get("state") && selectedState !== "PUBLISHED") {
    const found = LESSON_STATE_OPTIONS.find((s) => s.value === selectedState);
    activePills.push({
      key: `state-${selectedState}`,
      label: found ? found.label : selectedState,
      onRemove: () => setSingleParam("state", "PUBLISHED", "PUBLISHED"),
    });
  }

  if (!hideTags) {
    for (const tagId of selectedTags) {
      const found = tags.find((t) => t.id === tagId);
      activePills.push({
        key: `tag-${tagId}`,
        label: found ? `#${found.name}` : "#tag",
        onRemove: () => toggleListValue("tags", selectedTags, tagId),
      });
    }
  }

  const resolvedRight =
    sortSlot ??
    rightActions ??
    (showSort ? (
      <ContentSortToggle
        sort={currentSort}
        timeframe={currentTimeframe}
        onSortChange={handleSortChange}
        onTimeframeChange={handleTimeframeChange}
      />
    ) : null);

  return (
    <section
      aria-label="Feed filters and sorting"
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-border bg-card/90 px-3 py-2.5 shadow-2xs backdrop-blur-xs md:sticky md:top-14 md:z-20",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Compact Filter Popover Chips */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            aria-hidden="true"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filter</span>
          </span>

          <MultiFilterChip
            label="Level"
            options={levels.map((l) => ({ value: l.id, label: l.name }))}
            selected={selectedLevels}
            onToggle={(v) => toggleListValue("level", selectedLevels, v)}
            onClear={() => setListParam("level", [])}
            isLoading={levelsLoading}
          />

          <MultiFilterChip
            label="Subject"
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            selected={selectedSubjects}
            onToggle={(v) => toggleListValue("subject", selectedSubjects, v)}
            onClear={() => setListParam("subject", [])}
            searchable
            searchPlaceholder="Find subject..."
            isLoading={subjectsLoading}
          />

          {showPostType && (
            <MultiFilterChip
              label="Type"
              options={postTypeOptions}
              selected={selectedTypes}
              onToggle={(v) => toggleListValue("post_type", selectedTypes, v)}
              onClear={() => setListParam("post_type", [])}
            />
          )}

          {showProblemStatus && (
            <SingleFilterChip
              label="Status"
              options={PROBLEM_STATUS_OPTIONS}
              value={selectedStatus}
              defaultValue=""
              onChange={(v) => setSingleParam("status", v)}
            />
          )}

          {effectiveShowStateFilter && (
            <SingleFilterChip
              label="State"
              options={LESSON_STATE_OPTIONS}
              value={selectedState}
              defaultValue="PUBLISHED"
              onChange={(v) => setSingleParam("state", v, "PUBLISHED")}
            />
          )}

          {!hideTags && (
            <MultiFilterChip
              label="Tags"
              options={tags.map((t) => ({ value: t.id, label: t.name }))}
              selected={selectedTags}
              onToggle={(v) => toggleListValue("tags", selectedTags, v)}
              onClear={() => setListParam("tags", [])}
              searchable
              searchPlaceholder="Search tags..."
              isLoading={tagsLoading}
              icon={<Hash className="size-3 shrink-0 opacity-75" aria-hidden="true" />}
            />
          )}
        </div>

        {/* Right: Sort & Timeframe Controls */}
        {resolvedRight && (
          <div className="flex items-center gap-2 shrink-0">{resolvedRight}</div>
        )}
      </div>

      {/* Removable Active Filter Pills Row */}
      {hasFilters && activePills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            Active:
          </span>
          {activePills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={pill.onRemove}
              aria-label={`Remove ${pill.label} filter`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{pill.label}</span>
              <X className="size-3 shrink-0" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="ml-1 rounded px-1.5 py-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear all
          </button>
        </div>
      )}
    </section>
  );
}
