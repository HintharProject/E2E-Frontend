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
import { SubjectAnalytics, LevelAnalytics } from "./admin-analytics-types";
import {
  TrendingUp,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Percent,
  Activity,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminResponseDepthChartProps {
  subjects: SubjectAnalytics[];
  levels: LevelAnalytics[];
}

type DomainFocus = "problems" | "forum";
type Dimension = "subjects" | "levels";

interface ChartDataItem {
  name: string;
  code: string;
  fullName?: string;
  total: number;
  solved: number;
  unanswered: number;
  solvedRate: number;
  ratio: number;
}

export function AdminResponseDepthChart({
  subjects,
  levels,
}: AdminResponseDepthChartProps) {
  const [domain, setDomain] = useState<DomainFocus>("problems");
  const [dimension, setDimension] = useState<Dimension>("subjects");

  const sourceData = dimension === "subjects" ? subjects : levels;

  const { chartData, metrics } = useMemo(() => {
    const isProb = domain === "problems";
    const isSubjects = dimension === "subjects";

    let totalItems = 0;
    let totalResponses = 0;
    let totalSolved = 0;
    let totalUnanswered = 0;

    const data: ChartDataItem[] = sourceData.map((item) => {
      const displayLabel = isSubjects ? item.code || item.name : item.name;

      if (isProb) {
        const total = item.problems_count || 0;
        const solutions = item.solutions_count || 0;
        const unanswered = typeof item.unanswered_problems_count === "number"
          ? item.unanswered_problems_count
          : Math.max(0, total - (item.solved_problems_count || 0));
        const solved = typeof item.solved_problems_count === "number"
          ? item.solved_problems_count
          : Math.max(0, total - unanswered);
        const solvedRate = typeof item.solved_rate_pct === "number"
          ? item.solved_rate_pct
          : (total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 100);
        const avg = item.avg_solutions_per_problem ?? (total > 0 ? Number((solutions / total).toFixed(2)) : 0);

        totalItems += total;
        totalResponses += solutions;
        totalSolved += solved;
        totalUnanswered += unanswered;

        return {
          name: displayLabel,
          code: item.code,
          fullName: item.name,
          total,
          solved,
          unanswered,
          solvedRate,
          ratio: avg,
        };
      } else {
        const total = item.posts_count || 0;
        const comments = item.comments_count || 0;
        const avg = item.avg_comments_per_post || 0;
        const withReplies = Math.min(total, comments > 0 ? Math.min(total, comments) : 0);
        const zeroReplies = Math.max(0, total - withReplies);
        const replyRate = total > 0 ? Math.round((withReplies / total) * 100) : 100;

        totalItems += total;
        totalResponses += comments;
        totalSolved += withReplies;
        totalUnanswered += zeroReplies;

        return {
          name: displayLabel,
          code: item.code,
          fullName: item.name,
          total,
          solved: withReplies,
          unanswered: zeroReplies,
          solvedRate: replyRate,
          ratio: avg,
        };
      }
    });

    const overallRate = totalItems > 0 ? Math.round((totalSolved / totalItems) * 100) : 100;
    const overallRatio = totalItems > 0 ? Number((totalResponses / totalItems).toFixed(2)) : 0;

    return {
      chartData: data,
      metrics: {
        totalItems,
        totalResponses,
        totalSolved,
        totalUnanswered,
        overallRate,
        overallRatio,
      },
    };
  }, [domain, dimension, sourceData]);

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-xs transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col gap-5 border-b border-line/60 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
              <h3 className="text-lg font-semibold text-ink">
                {domain === "problems"
                  ? "Problem Resolution & Answer Velocity"
                  : "Forum Engagement & Discussion Depth"}
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {domain === "problems"
                ? "Track challenge resolution rates, answer volume, and topic velocity across the academic catalog."
                : "Monitor discussion engagement, conversation density, and reply volume across the community."}
            </p>
          </div>

          {/* Quick Stats Strip */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-surface text-xs">
              <Percent className="size-3.5 text-emerald-500" />
              <span className="text-ink-muted">{domain === "problems" ? "Solved Rate:" : "Active Discussions:"}</span>
              <span className="font-bold text-ink">{metrics.overallRate}%</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-surface text-xs">
              <Zap className="size-3.5 text-primary" />
              <span className="text-ink-muted">{domain === "problems" ? "Response Velocity:" : "Reply Density:"}</span>
              <span className="font-bold text-primary">{metrics.overallRatio}x</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-surface text-xs">
              {metrics.overallRatio >= 1.0 ? (
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> High Engagement
                </span>
              ) : (
                <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="size-3.5" /> Under-Resourced
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/60 p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Focus Domain:</span>
            <div className="inline-flex rounded-lg border border-line bg-card p-0.5 text-xs font-medium shadow-2xs">
              <button
                type="button"
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
                type="button"
                onClick={() => setDomain("forum")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                  domain === "forum"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <MessageSquare className="size-3.5" />
                Forum Discussions
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Segment By:</span>
            <div className="inline-flex rounded-lg border border-line bg-card p-0.5 text-xs font-medium shadow-2xs">
              <button
                type="button"
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
                type="button"
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
            No activity data available for current segment.
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
                tick={{ fill: "currentColor", fontSize: 11 }}
                className="text-ink-muted font-medium"
                tickLine={false}
                axisLine={{ stroke: "var(--line)" }}
                interval={0}
                angle={chartData.length > 5 ? -20 : 0}
                textAnchor={chartData.length > 5 ? "end" : "middle"}
                dy={chartData.length > 5 ? 4 : 8}
              />
              <YAxis
                tick={{ fill: "currentColor", fontSize: 11 }}
                className="text-ink-muted"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as ChartDataItem;
                  const isProb = domain === "problems";
                  return (
                    <div className="rounded-xl border border-line bg-card/95 backdrop-blur-md p-3.5 shadow-xl text-xs text-ink min-w-[210px]">
                      <div className="font-semibold text-sm border-b border-line pb-1.5 mb-2 flex items-center justify-between gap-2">
                        <span className="truncate">{item.fullName || label}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {isProb ? `${item.solvedRate}% Solved` : `${item.solvedRate}% with Replies`}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-ink-muted">
                          <span>{isProb ? "Total Challenges:" : "Total Discussions:"}</span>
                          <span className="font-semibold text-ink">{item.total}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                          <span>{isProb ? "Answered / Solved:" : "Active with Replies:"}</span>
                          <span className="font-semibold">{item.solved}</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                          <span>{isProb ? "Unanswered Gaps:" : "Zero-Reply Threads:"}</span>
                          <span className="font-semibold">{item.unanswered}</span>
                        </div>
                        <div className="flex justify-between items-center text-primary pt-1 border-t border-line/60">
                          <span>{isProb ? "Avg Solutions / Problem:" : "Avg Replies / Post:"}</span>
                          <span className="font-bold">{item.ratio}x</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }}
                iconType="circle"
              />

              <Bar
                dataKey="solved"
                name={domain === "problems" ? "Answered / Solved" : "Active with Replies"}
                fill="#10b981"
                stackId="stack"
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="unanswered"
                name={domain === "problems" ? "Unanswered Bottlenecks" : "Zero Replies"}
                fill="#f59e0b"
                stackId="stack"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
