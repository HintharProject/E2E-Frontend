"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { SubjectAnalytics, LevelAnalytics } from "./admin-analytics-types";
import { TrendingUp, HelpCircle, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

interface AdminResponseDepthChartProps {
  subjects: SubjectAnalytics[];
  levels: LevelAnalytics[];
}

type DomainFocus = "problems" | "forum";
type Dimension = "subjects" | "levels";

interface ResponseChartItem {
  name: string;
  code: string;
  Problems?: number;
  Solutions?: number;
  "Mean Solutions/Prob"?: number;
  Posts?: number;
  Comments?: number;
  "Mean Comments/Post"?: number;
}

export function AdminResponseDepthChart({
  subjects,
  levels,
}: AdminResponseDepthChartProps) {
  const [domain, setDomain] = useState<DomainFocus>("problems");
  const [dimension, setDimension] = useState<Dimension>("subjects");

  const sourceData = dimension === "subjects" ? subjects : levels;

  const { chartData, overallMeanRatio } = useMemo(() => {
    const isProb = domain === "problems";
    const data: ResponseChartItem[] = sourceData.map((item) => {
      if (isProb) {
        return {
          name: item.name,
          code: item.code,
          Problems: item.problems_count,
          Solutions: item.solutions_count,
          "Mean Solutions/Prob": item.avg_solutions_per_problem,
        };
      }
      return {
        name: item.name,
        code: item.code,
        Posts: item.posts_count,
        Comments: item.comments_count,
        "Mean Comments/Post": item.avg_comments_per_post,
      };
    });

    const totalQ = sourceData.reduce(
      (sum, item) => sum + (isProb ? item.problems_count : item.posts_count),
      0
    );
    const totalA = sourceData.reduce(
      (sum, item) => sum + (isProb ? item.solutions_count : item.comments_count),
      0
    );

    const mean = totalQ > 0 ? Number((totalA / totalQ).toFixed(2)) : 0;

    return {
      chartData: data,
      overallMeanRatio: mean,
    };
  }, [domain, sourceData]);

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-xs transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 border-b border-line/60 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
              <h3 className="text-lg font-semibold text-ink">
                {domain === "problems"
                  ? "Q&A Answer Depth & Coverage"
                  : "Forum Discussion & Engagement"}
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {domain === "problems"
                ? "Compare challenge counts against solution volume with the average answers-per-problem trend line."
                : "Compare discussion posts against comments with the average reply density trend line."}
            </p>
          </div>

          {/* Health Metric Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-muted/30 px-3 py-1.5 text-xs">
              <span className="text-ink-muted">
                {domain === "problems" ? "Avg Solutions/Prob:" : "Avg Comments/Post:"}
              </span>
              <strong className="font-semibold text-primary">
                {overallMeanRatio}x
              </strong>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-muted/30 px-3 py-1.5 text-xs">
              {overallMeanRatio >= 1.0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="size-3.5" /> Healthy Engagement
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertCircle className="size-3.5" /> Below Target Ratio
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/80 bg-muted/20 p-2.5">
          {/* Domain Focus Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Ecosystem:</span>
            <div className="inline-flex rounded-lg border border-line bg-card p-0.5 text-xs font-medium shadow-2xs">
              <button
                onClick={() => setDomain("problems")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                  domain === "problems"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <HelpCircle className="size-3.5" />
                Problems & Solutions
              </button>
              <button
                onClick={() => setDomain("forum")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                  domain === "forum"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <MessageSquare className="size-3.5" />
                Forum Posts & Comments
              </button>
            </div>
          </div>

          {/* Dimension Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Segment By:</span>
            <div className="inline-flex rounded-lg border border-line bg-card p-0.5 text-xs font-medium shadow-2xs">
              <button
                onClick={() => setDimension("subjects")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  dimension === "subjects"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                By Subject
              </button>
              <button
                onClick={() => setDimension("levels")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  dimension === "levels"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                By Level
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-[380px] w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            No response data available for current segment.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <ComposedChart
              data={chartData}
              margin={{ top: 16, right: 24, left: -10, bottom: 28 }}
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
              {/* Left Y-Axis: Raw Volume Counts */}
              <YAxis
                yAxisId="left"
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-ink-muted"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              {/* Right Y-Axis: Mean Ratio */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "currentColor", fontSize: 12 }}
                className="text-ink-muted"
                tickLine={false}
                axisLine={false}
                unit="x"
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

              {domain === "problems" ? (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="Problems"
                    name="Problems (Challenges)"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="Solutions"
                    name="Solutions (Answers)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Mean Solutions/Prob"
                    name="Avg Solutions / Problem"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "var(--card)" }}
                    activeDot={{ r: 6 }}
                  />
                </>
              ) : (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="Posts"
                    name="Forum Posts"
                    fill="#0284c7"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="Comments"
                    name="Comments / Replies"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Mean Comments/Post"
                    name="Avg Comments / Post"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "var(--card)" }}
                    activeDot={{ r: 6 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
