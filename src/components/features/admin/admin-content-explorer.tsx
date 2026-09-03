"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  SubjectAnalytics,
  LevelAnalytics,
  MatrixItem,
  BaseDimension,
  GroupingDimension,
  ContentTypeKey,
} from "./admin-analytics-types";
import {
  BarChart3,
  Filter,
  RotateCcw,
  BookOpen,
  MessageSquare,
  HelpCircle,
  CheckCheck,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

interface AdminContentExplorerProps {
  subjects: SubjectAnalytics[];
  levels: LevelAnalytics[];
  matrix: MatrixItem[];
}

const CONTENT_TYPE_CONFIG: Record<
  ContentTypeKey,
  { label: string; color: string; icon: React.ElementType }
> = {
  lessons: { label: "Lessons", color: "#0d9488", icon: BookOpen }, // Teal
  posts: { label: "Posts", color: "#0284c7", icon: MessageSquare }, // Sky
  problems: { label: "Problems", color: "#f59e0b", icon: HelpCircle }, // Amber
  solutions: { label: "Solutions", color: "#10b981", icon: CheckCheck }, // Emerald
};

const CATEGORICAL_PALETTE = [
  "#0d9488", // Teal
  "#0284c7", // Sky
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f97316", // Orange
  "#14b8a6", // Mint
  "#a855f7", // Violet
  "#e11d48", // Rose
  "#64748b", // Slate
];

export function AdminContentExplorer({
  subjects,
  levels,
  matrix,
}: AdminContentExplorerProps) {
  // 1. Primary Dimension Controls
  const [baseDimension, setBaseDimension] = useState<BaseDimension>("subject");
  const [groupingDimension, setGroupingDimension] =
    useState<GroupingDimension>("content");

  // 2. Multi-select Filters State
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(() =>
    subjects.map((s) => s.id)
  );
  const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>(() =>
    levels.map((l) => l.id)
  );
  const [selectedContentTypes, setSelectedContentTypes] = useState<
    ContentTypeKey[]
  >(["lessons", "posts", "problems", "solutions"]);

  // 3. UI Filter drawer visibility
  const [showFilters, setShowFilters] = useState(false);

  // Auto-switch grouping dimension when base dimension changes if needed
  const handleBaseChange = (newBase: BaseDimension) => {
    setBaseDimension(newBase);
    if (newBase === "subject") {
      if (groupingDimension === "subject") setGroupingDimension("content");
    } else if (newBase === "level") {
      if (groupingDimension === "level") setGroupingDimension("content");
    } else if (newBase === "content") {
      if (groupingDimension === "content") setGroupingDimension("subject");
    }
  };

  // Available grouping options for the current base
  const availableGroupings: { id: GroupingDimension; label: string }[] =
    useMemo(() => {
      if (baseDimension === "subject") {
        return [
          { id: "content", label: "By Content Type" },
          { id: "level", label: "By Level" },
        ];
      }
      if (baseDimension === "level") {
        return [
          { id: "content", label: "By Content Type" },
          { id: "subject", label: "By Subject" },
        ];
      }
      return [
        { id: "subject", label: "By Subject" },
        { id: "level", label: "By Level" },
      ];
    }, [baseDimension]);

  // Subject quick toggle helpers
  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const selectAllSubjects = () =>
    setSelectedSubjectIds(subjects.map((s) => s.id));
  const deselectAllSubjects = () => setSelectedSubjectIds([]);

  // Level quick toggle helpers
  const toggleLevel = (id: string) => {
    setSelectedLevelIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const selectAllLevels = () => setSelectedLevelIds(levels.map((l) => l.id));
  const deselectAllLevels = () => setSelectedLevelIds([]);

  // Content type toggle helper
  const toggleContentType = (type: ContentTypeKey) => {
    setSelectedContentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetAllFilters = () => {
    setSelectedSubjectIds(subjects.map((s) => s.id));
    setSelectedLevelIds(levels.map((l) => l.id));
    setSelectedContentTypes(["lessons", "posts", "problems", "solutions"]);
  };

  const isFiltered =
    selectedSubjectIds.length < subjects.length ||
    selectedLevelIds.length < levels.length ||
    selectedContentTypes.length < 4;

  // Compute Fast Lookup Matrix Map: `${subject_id}_${level_id}` -> MatrixItem
  const matrixMap = useMemo(() => {
    const map = new Map<string, MatrixItem>();
    matrix.forEach((m) => {
      map.set(`${m.subject_id}_${m.level_id}`, m);
    });
    return map;
  }, [matrix]);

  // Generate Grouped Chart Data and Series Definition
  const { chartData, seriesList, totalSliceVolume, peakCategory } =
    useMemo(() => {
      const activeSubjects = subjects.filter((s) =>
        selectedSubjectIds.includes(s.id)
      );
      const activeLevels = levels.filter((l) =>
        selectedLevelIds.includes(l.id)
      );
      const activeTypes = selectedContentTypes;

      let data: Array<Record<string, string | number>> = [];
      let series: Array<{ key: string; label: string; color: string }> = [];
      let totalVolume = 0;
      let highestVol = -1;
      let topLabel = "None";

      // HELPER: calculate sum for a given matrix cell given active content types
      const getCellCount = (
        subjectId: string,
        levelId: string,
        typeOverride?: ContentTypeKey
      ) => {
        const item = matrixMap.get(`${subjectId}_${levelId}`);
        if (!item) return 0;
        if (typeOverride) {
          switch (typeOverride) {
            case "lessons":
              return item.lessons_count;
            case "posts":
              return item.posts_count;
            case "problems":
              return item.problems_count;
            case "solutions":
              return item.solutions_count;
          }
        }
        let cellSum = 0;
        if (activeTypes.includes("lessons")) cellSum += item.lessons_count;
        if (activeTypes.includes("posts")) cellSum += item.posts_count;
        if (activeTypes.includes("problems")) cellSum += item.problems_count;
        if (activeTypes.includes("solutions")) cellSum += item.solutions_count;
        return cellSum;
      };

      // -------------------------------------------------------------
      // SCENARIO 1: Base = SUBJECT
      // -------------------------------------------------------------
      if (baseDimension === "subject") {
        if (groupingDimension === "content") {
          // Series = Content Types
          series = activeTypes.map((t) => ({
            key: CONTENT_TYPE_CONFIG[t].label,
            label: CONTENT_TYPE_CONFIG[t].label,
            color: CONTENT_TYPE_CONFIG[t].color,
          }));

          data = activeSubjects.map((s) => {
            const row: Record<string, string | number> = {
              name: s.name,
              code: s.code,
            };
            let rowTotal = 0;

            activeTypes.forEach((t) => {
              const count = activeLevels.reduce(
                (sum, l) => sum + getCellCount(s.id, l.id, t),
                0
              );
              row[CONTENT_TYPE_CONFIG[t].label] = count;
              rowTotal += count;
            });

            totalVolume += rowTotal;
            if (rowTotal > highestVol) {
              highestVol = rowTotal;
              topLabel = s.name;
            }
            return row;
          });
        } else {
          // Grouping = Level
          series = activeLevels.map((l, idx) => ({
            key: l.name,
            label: `${l.name} (${l.code})`,
            color: CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length],
          }));

          data = activeSubjects.map((s) => {
            const row: Record<string, string | number> = {
              name: s.name,
              code: s.code,
            };
            let rowTotal = 0;

            activeLevels.forEach((l) => {
              const count = getCellCount(s.id, l.id);
              row[l.name] = count;
              rowTotal += count;
            });

            totalVolume += rowTotal;
            if (rowTotal > highestVol) {
              highestVol = rowTotal;
              topLabel = s.name;
            }
            return row;
          });
        }
      }

      // -------------------------------------------------------------
      // SCENARIO 2: Base = LEVEL
      // -------------------------------------------------------------
      else if (baseDimension === "level") {
        if (groupingDimension === "content") {
          // Series = Content Types
          series = activeTypes.map((t) => ({
            key: CONTENT_TYPE_CONFIG[t].label,
            label: CONTENT_TYPE_CONFIG[t].label,
            color: CONTENT_TYPE_CONFIG[t].color,
          }));

          data = activeLevels.map((l) => {
            const row: Record<string, string | number> = {
              name: l.name,
              code: l.code,
            };
            let rowTotal = 0;

            activeTypes.forEach((t) => {
              const count = activeSubjects.reduce(
                (sum, s) => sum + getCellCount(s.id, l.id, t),
                0
              );
              row[CONTENT_TYPE_CONFIG[t].label] = count;
              rowTotal += count;
            });

            totalVolume += rowTotal;
            if (rowTotal > highestVol) {
              highestVol = rowTotal;
              topLabel = l.name;
            }
            return row;
          });
        } else {
          // Grouping = Subject
          series = activeSubjects.map((s, idx) => ({
            key: s.name,
            label: s.name,
            color: CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length],
          }));

          data = activeLevels.map((l) => {
            const row: Record<string, string | number> = {
              name: l.name,
              code: l.code,
            };
            let rowTotal = 0;

            activeSubjects.forEach((s) => {
              const count = getCellCount(s.id, l.id);
              row[s.name] = count;
              rowTotal += count;
            });

            totalVolume += rowTotal;
            if (rowTotal > highestVol) {
              highestVol = rowTotal;
              topLabel = l.name;
            }
            return row;
          });
        }
      }

      // -------------------------------------------------------------
      // SCENARIO 3: Base = CONTENT TYPE
      // -------------------------------------------------------------
      else {
        if (groupingDimension === "subject") {
          // Series = Subjects
          series = activeSubjects.map((s, idx) => ({
            key: s.name,
            label: s.name,
            color: CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length],
          }));

          data = activeTypes.map((t) => {
            const typeLabel = CONTENT_TYPE_CONFIG[t].label;
            const row: Record<string, string | number> = { name: typeLabel };
            let rowTotal = 0;

            activeSubjects.forEach((s) => {
              const count = activeLevels.reduce(
                (sum, l) => sum + getCellCount(s.id, l.id, t),
                0
              );
              row[s.name] = count;
              rowTotal += count;
            });

            totalVolume += rowTotal;
            if (rowTotal > highestVol) {
              highestVol = rowTotal;
              topLabel = typeLabel;
            }
            return row;
          });
        } else {
          // Grouping = Level
          series = activeLevels.map((l, idx) => ({
            key: l.name,
            label: `${l.name} (${l.code})`,
            color: CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length],
          }));

          data = activeTypes.map((t) => {
            const typeLabel = CONTENT_TYPE_CONFIG[t].label;
            const row: Record<string, string | number> = { name: typeLabel };
            let rowTotal = 0;

            activeLevels.forEach((l) => {
              const count = activeSubjects.reduce(
                (sum, s) => sum + getCellCount(s.id, l.id, t),
                0
              );
              row[l.name] = count;
              rowTotal += count;
            });

            totalVolume += rowTotal;
            if (rowTotal > highestVol) {
              highestVol = rowTotal;
              topLabel = typeLabel;
            }
            return row;
          });
        }
      }

      return {
        chartData: data,
        seriesList: series,
        totalSliceVolume: totalVolume,
        peakCategory: highestVol > 0 ? topLabel : "None",
      };
    }, [
      baseDimension,
      groupingDimension,
      selectedSubjectIds,
      selectedLevelIds,
      selectedContentTypes,
      subjects,
      levels,
      matrixMap,
    ]);

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-xs transition-all">
      {/* Header & Main Dimension Selectors */}
      <div className="flex flex-col gap-5 border-b border-line/60 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="size-4" />
              </div>
              <h3 className="text-lg font-semibold text-ink">
                Multidimensional Content Distribution
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Dynamically slice, pivot, and compare grouped curriculum volume
              across Subjects, Levels, and Content Types.
            </p>
          </div>

          {/* Quick Metrics Badge Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-muted/30 px-3 py-1.5 text-xs">
              <span className="text-ink-muted">Slice Volume:</span>
              <strong className="font-semibold text-ink">
                {totalSliceVolume.toLocaleString()}
              </strong>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-muted/30 px-3 py-1.5 text-xs">
              <span className="text-ink-muted">Top Category:</span>
              <strong className="font-semibold text-primary">
                {peakCategory}
              </strong>
            </div>
          </div>
        </div>

        {/* Dynamic Slicing Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/80 bg-muted/20 p-2.5">
          {/* Base Dimension Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">
              Base X-Axis:
            </span>
            <div className="inline-flex rounded-lg border border-line bg-card p-0.5 text-xs font-medium shadow-2xs">
              <button
                onClick={() => handleBaseChange("subject")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  baseDimension === "subject"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                By Subject
              </button>
              <button
                onClick={() => handleBaseChange("level")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  baseDimension === "level"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                By Level
              </button>
              <button
                onClick={() => handleBaseChange("content")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  baseDimension === "content"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                By Content Type
              </button>
            </div>
          </div>

          {/* Grouping / Flip Dimension Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">
              Group Series By:
            </span>
            <div className="inline-flex rounded-lg border border-line bg-card p-0.5 text-xs font-medium shadow-2xs">
              {availableGroupings.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGroupingDimension(g.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                    groupingDimension === g.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <SlidersHorizontal className="size-3" />
                  {g.label}
                </button>
              ))}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                showFilters || isFiltered
                  ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                  : "border-line bg-card text-ink-muted hover:text-ink hover:bg-muted"
              }`}
            >
              <Filter className="size-3.5" />
              <span>Filters</span>
              {isFiltered && (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  !
                </span>
              )}
              <ChevronDown
                className={`size-3 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Interactive Filter Panel */}
        {showFilters && (
          <div className="flex flex-col gap-4 rounded-xl border border-line bg-card p-4 shadow-xs animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Filter & Slice Dataset
              </span>
              {isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <RotateCcw className="size-3" /> Reset all filters
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* 1. Content Types Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-ink">
                  Content Types ({selectedContentTypes.length}/4)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.keys(CONTENT_TYPE_CONFIG) as ContentTypeKey[]
                  ).map((type) => {
                    const cfg = CONTENT_TYPE_CONFIG[type];
                    const isSelected = selectedContentTypes.includes(type);
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => toggleContentType(type)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-transparent text-white shadow-xs"
                            : "border-line bg-muted/30 text-ink-muted hover:text-ink"
                        }`}
                        style={{
                          backgroundColor: isSelected ? cfg.color : undefined,
                        }}
                      >
                        <Icon className="size-3" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Educational Levels Filter */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    Levels ({selectedLevelIds.length}/{levels.length})
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      onClick={selectAllLevels}
                      className="text-primary hover:underline"
                    >
                      All
                    </button>
                    <span className="text-ink-muted">|</span>
                    <button
                      onClick={deselectAllLevels}
                      className="text-ink-muted hover:text-ink"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  {levels.map((l) => {
                    const isSelected = selectedLevelIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        onClick={() => toggleLevel(l.id)}
                        className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-line/60 bg-muted/20 text-ink-muted hover:text-ink"
                        }`}
                      >
                        {l.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Subjects Filter */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    Subjects ({selectedSubjectIds.length}/{subjects.length})
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      onClick={selectAllSubjects}
                      className="text-primary hover:underline"
                    >
                      All
                    </button>
                    <span className="text-ink-muted">|</span>
                    <button
                      onClick={deselectAllSubjects}
                      className="text-ink-muted hover:text-ink"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  {subjects.map((s) => {
                    const isSelected = selectedSubjectIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSubject(s.id)}
                        className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-line/60 bg-muted/20 text-ink-muted hover:text-ink"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-6 h-[400px] w-full">
        {chartData.length === 0 || seriesList.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-muted/10 p-6 text-center">
            <Filter className="size-8 text-ink-muted/50" />
            <p className="text-sm font-medium text-ink">
              No data matches your current filter selection.
            </p>
            <p className="text-xs text-ink-muted">
              Try selecting more subjects, levels, or content types above.
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 16, left: -10, bottom: 28 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-line/50"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-ink-muted font-medium"
                tickLine={false}
                axisLine={{ stroke: "var(--line)" }}
                interval={0}
                angle={chartData.length > 5 ? -20 : 0}
                textAnchor={chartData.length > 5 ? "end" : "middle"}
                dy={chartData.length > 5 ? 4 : 8}
              />
              <YAxis
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-ink-muted"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--line)",
                  borderRadius: "0.85rem",
                  color: "var(--ink)",
                  boxShadow:
                    "0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  fontSize: "12px",
                  padding: "10px 14px",
                }}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }}
                iconType="circle"
              />
              {seriesList.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
