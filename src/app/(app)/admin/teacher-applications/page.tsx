"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeacherApplication {
  id: string;
  user: string;
  user_details?: {
    display_name: string;
    email?: string;
  };
  years_of_experience: number;
  subject_specialization: string;
  additional_info: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

export default function AdminTeacherApplicationsPage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading: appsLoading } = useQuery<TeacherApplication[]>({
    queryKey: ["adminTeacherApplications"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>("/users/teacher-applications/", token);
      return Array.isArray(res) ? res : (res.data || res.results || []);
    },
    enabled: !!user && user.role === "ADMIN",
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/users/teacher-applications/${id}/review/`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTeacherApplications"] });
    },
  });

  if (userLoading || appsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-danger font-semibold">Unauthorized. Admin access required.</p>
      </div>
    );
  }

  const sortedApps = [...applications].sort((a, b) => {
    // Show pending first
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Teacher Applications" />
      </div>

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {sortedApps.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">
            No applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink">
              <thead className="bg-muted border-b border-line text-ink-muted">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Experience</th>
                  <th className="p-4 font-semibold">Subjects</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sortedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{app.user_details?.display_name || app.user}</div>
                      <div className="text-xs text-ink-muted mt-1 max-w-[200px] truncate" title={app.additional_info}>
                        {app.additional_info || "No additional info"}
                      </div>
                    </td>
                    <td className="p-4">{app.years_of_experience} yrs</td>
                    <td className="p-4">
                      <div className="max-w-[200px] truncate" title={app.subject_specialization}>
                        {app.subject_specialization}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={app.status === "PENDING" ? "secondary" : app.status === "APPROVED" ? "default" : "destructive"}
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {app.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 bg-success hover:bg-success/90 text-success-foreground"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({ id: app.id, status: "APPROVED" })}
                          >
                            <Check className="size-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({ id: app.id, status: "REJECTED" })}
                          >
                            <X className="size-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
