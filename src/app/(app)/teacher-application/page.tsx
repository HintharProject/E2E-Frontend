"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { TeacherApplicationForm } from "@/components/features/users/teacher-application-form";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface TeacherApplication {
  id: string;
  user: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  updated_at: string;
}

export default function TeacherApplicationPage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const { getToken } = useAuth();

  const { data: applications = [], isLoading: appsLoading, refetch } = useQuery<TeacherApplication[]>({
    queryKey: ["teacherApplications", user?.id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<TeacherApplication[]>("/users/teacher-applications/", token);
    },
    enabled: !!user,
  });

  if (userLoading || appsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "SENIOR_STUDENT") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 text-center">
        <p className="text-ink-muted">Only Senior Students can apply to be a Teacher.</p>
      </div>
    );
  }

  // Sort by newest first
  const sortedApps = [...applications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const latestApp = sortedApps[0];

  let stateView = null;

  if (latestApp?.status === "PENDING") {
    stateView = (
      <div className="rounded-2xl border border-warning/50 bg-warning/10 p-6 text-center flex flex-col items-center">
        <Clock className="size-12 text-warning mb-4" />
        <h3 className="text-xl font-semibold text-warning-foreground mb-2">Application Under Review</h3>
        <p className="text-ink-muted">Your application is currently being reviewed by an administrator. We will notify you once a decision is made.</p>
      </div>
    );
  } else if (latestApp?.status === "APPROVED") {
    stateView = (
      <div className="rounded-2xl border border-success/50 bg-success/10 p-6 text-center flex flex-col items-center">
        <CheckCircle2 className="size-12 text-success mb-4" />
        <h3 className="text-xl font-semibold text-success-foreground mb-2">Application Approved</h3>
        <p className="text-ink-muted">Congratulations! You are now a Teacher on the platform.</p>
      </div>
    );
  } else if (latestApp?.status === "REJECTED") {
    // Check if within 24 hours for cooldown
    const rejectedDate = new Date(latestApp.updated_at);
    const now = new Date();
    const hoursSinceRejected = (now.getTime() - rejectedDate.getTime()) / (1000 * 60 * 60);
    const cooldownHours = 24;

    if (hoursSinceRejected < cooldownHours) {
      const remainingHours = Math.ceil(cooldownHours - hoursSinceRejected);
      stateView = (
        <div className="rounded-2xl border border-danger/50 bg-danger/10 p-6 text-center flex flex-col items-center">
          <AlertCircle className="size-12 text-danger mb-4" />
          <h3 className="text-xl font-semibold text-danger-foreground mb-2">Application Rejected</h3>
          <p className="text-ink-muted">Your previous application was rejected. Please wait {remainingHours} hours before reapplying.</p>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <PageHeader title="Apply for Teacher Role" />
        <p className="mt-2 text-ink-muted">
          Teachers are trusted members of the community who have high vote weighting and can post certified lessons.
        </p>
      </div>

      {stateView ? (
        stateView
      ) : (
        <TeacherApplicationForm onSuccess={() => refetch()} />
      )}
    </div>
  );
}
