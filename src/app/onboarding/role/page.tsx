"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { AppUser } from "@/types/user";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSelectRole = async (role: "STUDENT" | "SENIOR_STUDENT") => {
    setError("");
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      await apiFetch<AppUser>("/users/me/", token, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });

      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      router.push("/onboarding/profile");
    } catch (err: any) {
      setError(err.message || "Failed to set role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <PageHeader title="Choose Your Path" />
        <p className="mt-4 text-lg text-ink-muted">
          Welcome to E2E! How do you want to use the platform?
        </p>
      </div>
      
      <FormErrorBanner serverMessage={error} />

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <div 
          onClick={() => !isSubmitting && handleSelectRole("STUDENT")}
          className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-brand hover:shadow-md ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="mb-4 rounded-full bg-brand/10 p-4 text-brand">
            <BookOpen className="size-10" />
          </div>
          <h3 className="text-2xl font-bold text-ink">Student</h3>
          <p className="mt-2 text-ink-muted">
            I want to learn, ask questions, and follow study plans created by experts.
          </p>
        </div>

        <div 
          onClick={() => !isSubmitting && handleSelectRole("SENIOR_STUDENT")}
          className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-brand hover:shadow-md ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="mb-4 rounded-full bg-brand/10 p-4 text-brand">
            <GraduationCap className="size-10" />
          </div>
          <h3 className="text-2xl font-bold text-ink">Contributor</h3>
          <p className="mt-2 text-ink-muted">
            I want to share my knowledge, answer questions, and help others learn.
          </p>
        </div>
      </div>
      
      {isSubmitting && (
        <div className="mt-8 flex justify-center text-brand">
          <Loader2 className="size-6 animate-spin" />
          <span className="ml-2">Setting up your account...</span>
        </div>
      )}
    </div>
  );
}
