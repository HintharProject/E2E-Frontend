"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseFilterList,
  serializeFilterList,
} from "@/lib/filter-params";
import { useSubjects, useLevels, useTags } from "@/hooks/use-metadata";

type FilterSidebarProps = {
  showPostType?: boolean;
  showStateFilter?: boolean;
  hideTags?: boolean;
  showProblemStatus?: boolean;
  postTypeOptions?: { value: string; label: string }[];
};

function CheckboxGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {legend}
      </legend>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-line accent-brand"
                checked={checked}
                onChange={() => onToggle(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FilterSidebar({
  showPostType = false,
  showStateFilter = false,
  hideTags = false,
  showProblemStatus = false,
  postTypeOptions = [
    { value: "QUESTION", label: "Question" },
    { value: "SHARING", label: "Sharing" },
  ],
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isManagePage = pathname === "/lessons/manage";
  const effectiveShowStateFilter = showStateFilter || isManagePage;

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();
  const { data: tags = [] } = useTags();

  const selectedSubjects = parseFilterList(searchParams.get("subject"));
  const selectedLevels = parseFilterList(searchParams.get("level"));
  const selectedTypes = parseFilterList(searchParams.get("post_type"));
  const selectedTags = parseFilterList(searchParams.get("tags"));
  const hasFilters =
    selectedSubjects.length > 0 ||
    selectedLevels.length > 0 ||
    selectedTypes.length > 0 ||
    selectedTags.length > 0 ||
    searchParams.get("status");

  function setListParam(key: string, values: string[]) {
    const next = new URLSearchParams(searchParams.toString());
    if (values.length > 0) next.set(key, serializeFilterList(values));
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggle(key: string, current: string[], value: string) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setListParam(key, next);
  }

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <div className="sticky top-24 space-y-5 rounded-2xl border border-line bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg text-ink">Filters</h2>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-brand-dark hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
        <CheckboxGroup
          legend="Subject"
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          selected={selectedSubjects}
          onToggle={(value) => toggle("subject", selectedSubjects, value)}
        />
        <CheckboxGroup
          legend="Level"
          options={levels.map((l) => ({ value: l.id, label: l.name }))}
          selected={selectedLevels}
          onToggle={(value) => toggle("level", selectedLevels, value)}
        />
        {showPostType ? (
          <CheckboxGroup
            legend="Type"
            options={postTypeOptions}
            selected={selectedTypes}
            onToggle={(value) => toggle("post_type", selectedTypes, value)}
          />
        ) : null}
        {effectiveShowStateFilter ? (
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Status
            </legend>
            <div className="flex flex-col gap-2">
              {[
                { value: "PUBLISHED", label: "Published" },
                { value: "DRAFT", label: "Draft" },
                { value: "ARCHIVED", label: "Archived" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
                >
                  <input
                    type="radio"
                    name="State"
                    className="h-4 w-4 shrink-0 border-line accent-brand"
                    checked={searchParams.get("state") === opt.value || (!searchParams.get("state") && opt.value === "PUBLISHED")}
                    onChange={() => {
                      const next = new URLSearchParams(searchParams.toString());
                      next.set("state", opt.value);
                      router.push(`${pathname}?${next.toString()}`);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {showProblemStatus ? (
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Status
            </legend>
            <div className="flex flex-col gap-2">
              {[
                { value: "", label: "All" },
                { value: "OPEN", label: "Open" },
                { value: "SOLVED", label: "Solved" },
                { value: "CLOSED", label: "Closed" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
                >
                  <input
                    type="radio"
                    name="Status"
                    className="h-4 w-4 shrink-0 border-line accent-brand"
                    checked={searchParams.get("status") === opt.value || (!searchParams.get("status") && opt.value === "")}
                    onChange={() => {
                      const next = new URLSearchParams(searchParams.toString());
                      if (opt.value) {
                        next.set("status", opt.value);
                      } else {
                        next.delete("status");
                      }
                      router.push(`${pathname}?${next.toString()}`);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {!hideTags && (
          <CheckboxGroup
            legend="Tag"
            options={tags.map((t) => ({ value: t.id, label: t.name }))}
            selected={selectedTags}
            onToggle={(value) => toggle("tags", selectedTags, value)}
          />
        )}
      </div>
    </aside>
  );
}
