"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useTagSuggestions } from "@/hooks/use-tag-suggestions";
import { X, Plus, Hash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  maxTags = 3,
  placeholder = "Add tags...",
  disabled = false,
  error,
  className,
}: TagInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions = [], isLoading } = useTagSuggestions(query, isOpen);

  // Normalize incoming text
  const sanitize = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9\-_]+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30);
  };

  const normalizedQuery = useMemo(() => sanitize(query), [query]);

  // Check if query is an exact match for an existing suggestion or already selected
  const exactMatchExists = suggestions.some((s) => s.name === normalizedQuery);
  const alreadySelected = value.includes(normalizedQuery);
  const canCreateNew = normalizedQuery.length >= 2 && !exactMatchExists && !alreadySelected;

  // Filter suggestions to exclude already selected tags
  const availableSuggestions = useMemo(() => {
    return suggestions.filter((s) => !value.includes(s.name));
  }, [suggestions, value]);

  // Options list for keyboard navigation
  const selectableOptions = useMemo(() => {
    const list: Array<{ type: "create" | "existing"; name: string; count?: number }> = [];
    if (canCreateNew) {
      list.push({ type: "create", name: normalizedQuery });
    }
    availableSuggestions.forEach((s) => {
      list.push({ type: "existing", name: s.name, count: s.total_count });
    });
    return list;
  }, [canCreateNew, normalizedQuery, availableSuggestions]);

  // Handle clicking outside to close popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const addTag = (tagName: string) => {
    const clean = sanitize(tagName);
    if (!clean || clean.length < 2 || value.length >= maxTags || value.includes(clean)) {
      return;
    }
    onChange([...value, clean]);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(value.filter((_, i) => i !== indexToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && selectableOptions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < selectableOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : selectableOptions.length - 1));
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < selectableOptions.length) {
        addTag(selectableOptions[highlightedIndex].name);
      } else if (normalizedQuery.length >= 2) {
        addTag(normalizedQuery);
      }
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const isMaxReached = value.length >= maxTags;

  return (
    <div ref={containerRef} className={cn("relative w-full space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>Tags (up to {maxTags})</span>
        <span className={cn(isMaxReached ? "font-semibold text-brand" : "text-ink-muted")}>
          {value.length}/{maxTags}
        </span>
      </div>

      <div
        onClick={() => !isMaxReached && inputRef.current?.focus()}
        className={cn(
          "flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-sm transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
          disabled && "cursor-not-allowed opacity-60",
          error && "border-danger focus-within:border-danger focus-within:ring-danger/20",
          isMaxReached && "cursor-default"
        )}
      >
        {value.map((tag, idx) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-ink bg-line/60"
          >
            <Hash className="size-3 text-ink-muted" />
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(idx);
                }}
                className="ml-0.5 rounded-full p-0.5 text-ink-muted hover:bg-line hover:text-ink"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          readOnly={isMaxReached}
          placeholder={value.length === 0 ? placeholder : (isMaxReached ? "" : "Add another...")}
          onChange={(e) => {
            if (isMaxReached) return;
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (!isMaxReached && (query.trim().length > 0 || selectableOptions.length > 0)) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-0",
            isMaxReached ? "w-0 min-w-0 pointer-events-none opacity-0" : "min-w-[120px] flex-1"
          )}
        />

        {isMaxReached && (
          <span className="text-xs italic text-ink-muted select-none">
            Maximum tags reached (press ⌫ to remove)
          </span>
        )}

        {isLoading && <Loader2 className="size-3.5 animate-spin text-ink-muted ml-auto" />}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Floating Suggestions Dropdown */}
      {isOpen && !isMaxReached && selectableOptions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-card p-1 shadow-lg custom-scrollbar">
          {selectableOptions.map((opt, idx) => {
            const isHighlighted = idx === highlightedIndex;
            if (opt.type === "create") {
              return (
                <div
                  key="create-new-option"
                  onClick={() => addTag(opt.name)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                    isHighlighted ? "bg-brand/10 text-brand font-medium" : "text-ink hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Plus className="size-3.5 text-brand" />
                    <span>Create <strong>&ldquo;#{opt.name}&rdquo;</strong></span>
                  </div>
                  <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[10px] text-brand">New</span>
                </div>
              );
            }

            return (
              <div
                key={opt.name}
                onClick={() => addTag(opt.name)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  isHighlighted ? "bg-muted font-medium text-ink" : "text-ink hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Hash className="size-3 text-ink-muted" />
                  <span>{opt.name}</span>
                </div>
                {opt.count !== undefined && (
                  <span className="text-[10px] text-ink-muted">{opt.count} used</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
