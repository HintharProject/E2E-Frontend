// src/hooks/use-mod-analytics.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";

export interface ModAnalyticsReportsSummary {
  lifetime_reports_count: number;
  direct_profile_reports: number;
  authored_content_reports: number;
  upheld_reports_count: number;
  dismissed_reports_count: number;
  pending_reports_count: number;
  by_reason: Record<string, number>;
}

export interface ModAnalyticsSanction {
  id: string;
  action: string;
  reason: string | null;
  admin_name: string;
  created_at: string;
}

export interface ModAnalyticsTransaction {
  id: string;
  event_type: string;
  delta: number;
  resulting_balance: number;
  created_at: string;
}

export interface ModAnalyticsProvenance {
  total_net_points: number;
  contributor_tier: number;
  breakdown: Record<string, number>;
  recent_transactions: ModAnalyticsTransaction[];
}

export interface ModAnalyticsFootprintEntry {
  total: number;
  active?: number;
  hidden: number;
  deleted: number;
  published?: number;
  draft?: number;
}

export interface ModAnalyticsFootprint {
  posts: ModAnalyticsFootprintEntry;
  problems: ModAnalyticsFootprintEntry;
  solutions: ModAnalyticsFootprintEntry;
  lessons: { total: number; published: number; draft: number };
  comments: ModAnalyticsFootprintEntry;
}

export interface ModAnalytics {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  ban_status: string;
  ban_expires_at: string | null;
  ban_seconds_remaining: number | null;
  created_at: string;
  risk_rating: "LOW" | "ELEVATED" | "HIGH_RISK";
  reports_summary: ModAnalyticsReportsSummary;
  sanctions_history: ModAnalyticsSanction[];
  contribution_provenance: ModAnalyticsProvenance;
  content_footprint: ModAnalyticsFootprint;
}

function getDevToken(): string | null {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true") {
    return localStorage.getItem("dev_token");
  }
  return null;
}

export function useModAnalytics(userId: string | null | undefined) {
  const { getToken } = useAuth();

  return useQuery<ModAnalytics>({
    queryKey: ["mod-analytics", userId],
    enabled: Boolean(userId),
    staleTime: 60 * 1000, // 1 min cache
    queryFn: async () => {
      const token = (await getToken()) || getDevToken();
      return apiFetch<ModAnalytics>(`/users/${userId}/mod-analytics/`, token || undefined);
    },
  });
}
