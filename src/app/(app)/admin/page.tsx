"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { RefreshCw } from "lucide-react";
import { AnalyticsResponse } from "@/components/features/admin/admin-analytics-types";
import { AdminKpiStrip } from "@/components/features/admin/admin-kpi-strip";
import { AdminContentExplorer } from "@/components/features/admin/admin-content-explorer";
import { AdminResponseDepthChart } from "@/components/features/admin/admin-response-depth-chart";
import { AdminCurriculumHealth } from "@/components/features/admin/admin-curriculum-health";

export default function AdminDashboardPage() {
  const { getToken } = useAuth();

  const { data, isLoading, error, refetch, isRefetching } = useQuery<AnalyticsResponse>({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<AnalyticsResponse>("/analytics/", token);
    },
  });

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Admin Analytics Dashboard"
          description="Real-time platform activity, community engagement, answer coverage, and curriculum health."
        />
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-semibold text-ink shadow-xs transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isRefetching ? "animate-spin text-primary" : "text-ink-muted"}`} />
          Refresh Stats
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-8">
          {/* Skeleton KPI Strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl border border-line bg-card/60 animate-pulse" />
            ))}
          </div>
          {/* Skeleton Content Explorer */}
          <div className="h-[480px] rounded-2xl border border-line bg-card/60 animate-pulse" />
          {/* Skeleton Response Depth */}
          <div className="h-[480px] rounded-2xl border border-line bg-card/60 animate-pulse" />
          {/* Skeleton Health Action Center */}
          <div className="h-[420px] rounded-2xl border border-line bg-card/60 animate-pulse" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center">
          <p className="text-sm font-medium text-danger">
            Failed to load analytics data: {(error as Error).message}
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-8">
          {/* ZONE 1: Executive KPI Strip */}
          {data.summary && <AdminKpiStrip summary={data.summary} />}

          {/* ZONE 2: Multidimensional Content Distribution Explorer */}
          <AdminContentExplorer
            subjects={data.by_subject || []}
            levels={data.by_level || []}
            matrix={data.matrix || []}
          />

          {/* ZONE 3: Community Response & Q&A Depth Engine */}
          <AdminResponseDepthChart
            subjects={data.by_subject || []}
            levels={data.by_level || []}
          />

          {/* ZONE 4: Curriculum Health & Action Center */}
          <AdminCurriculumHealth
            matrix={data.matrix || []}
            subjects={data.by_subject || []}
            levels={data.by_level || []}
          />
        </div>
      ) : null}
    </div>
  );
}
