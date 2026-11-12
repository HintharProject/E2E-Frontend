"use client";

import { useState } from "react";
import { useTags } from "@/hooks/use-metadata";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export type TagSearchFilterProps = {
  selectedTags: string[];
  onToggle: (tagId: string) => void;
};

export function TagSearchFilter({ selectedTags, onToggle }: TagSearchFilterProps) {
  const { data: tags = [], isLoading } = useTags();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tags
      </legend>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          className="h-8 rounded-md pl-9 text-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-1 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-card custom-scrollbar">
          {filteredTags.length === 0 ? (
            <p className="p-2 text-center text-xs text-muted-foreground">No tags found.</p>
          ) : (
            filteredTags.map((tag) => (
              <label
                key={tag.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md p-1.5 text-sm text-foreground hover:bg-muted/70 hover:text-primary transition-colors"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => onToggle(tag.id)}
                />
                <span>{tag.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </fieldset>
  );
}
