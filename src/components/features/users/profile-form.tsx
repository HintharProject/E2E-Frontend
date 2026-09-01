"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { AppUser } from "@/types/user";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

export function ProfileForm({
  user,
  isOnboarding = false,
}: {
  user?: AppUser | null;
  isOnboarding?: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: levels = [] } = useLevels();
  const { data: subjects = [] } = useSubjects();

  const formSchema = z.object({
    display_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Max 100 characters"),
    weak_subjects: z.array(z.string()).optional(),
    good_subjects: z.array(z.string()).optional(),
    level: z.string().optional().or(z.literal("")),
    custom_level: z.string().optional(),
    bio: z.string().max(1000, "Max 1000 characters").optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: user?.display_name || "",
      weak_subjects: user?.weak_subjects || [],
      good_subjects: user?.good_subjects || [],
      level: user?.custom_level ? "more" : (user?.level || ""),
      custom_level: user?.custom_level || "",
      bio: user?.bio || "",
    },
  });

  const levelWatch = watch("level");
  const weakSubjectsWatch = watch("weak_subjects") || [];
  const goodSubjectsWatch = watch("good_subjects") || [];

  const handleSubjectToggle = (subjectId: string, type: "weak" | "good") => {
    const currentList = type === "weak" ? weakSubjectsWatch : goodSubjectsWatch;
    const otherList = type === "weak" ? goodSubjectsWatch : weakSubjectsWatch;

    // Ensure it's not in both lists
    if (otherList.includes(subjectId)) {
      setValue(type === "weak" ? "good_subjects" : "weak_subjects", otherList.filter(id => id !== subjectId), { shouldValidate: true, shouldDirty: true });
    }

    if (currentList.includes(subjectId)) {
      setValue(type === "weak" ? "weak_subjects" : "good_subjects", currentList.filter(id => id !== subjectId), { shouldValidate: true, shouldDirty: true });
    } else {
      setValue(type === "weak" ? "weak_subjects" : "good_subjects", [...currentList, subjectId], { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      // We only send custom_level if "more" is selected
      const isCustomLevel = data.level === "more";
      
      const payload = {
        display_name: data.display_name,
        weak_subjects: data.weak_subjects,
        good_subjects: data.good_subjects,
        bio: data.bio,
        level: isCustomLevel ? null : (data.level || null),
        custom_level: isCustomLevel ? data.custom_level : null,
      };

      await apiFetch<AppUser>("/users/me/", token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      
      if (isOnboarding) {
        router.push("/forum");
      } else {
        router.push(`/users/${user?.id}`);
      }
    } catch (err: any) {
      setServerError(err.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSkip = () => {
    if (isOnboarding) {
      router.push("/forum");
    }
  };

  const onGoBack = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-2xl border border-line bg-card p-6 max-w-3xl mx-auto">
      <FormErrorBanner serverMessage={serverError} />

      <Field label="Display Name">
        <input
          {...register("display_name")}
          className={`${inputClass} ${errors.display_name ? errorClass : ""}`}
          placeholder="e.g. John Doe"
        />
        {errors.display_name && <p className="mt-1 text-xs text-danger">{errors.display_name.message}</p>}
      </Field>

      <Field label="Bio (max 1000)">
        <textarea
          {...register("bio")}
          className={`${inputClass} min-h-32 ${errors.bio ? errorClass : ""}`}
          placeholder="Tell us a little bit about yourself."
        />
        {errors.bio && <p className="mt-1 text-xs text-danger">{errors.bio.message}</p>}
      </Field>

      <div className="grid gap-8 sm:grid-cols-2">
        <Field label="Subjects to Improve (Weak)">
          <div className="max-h-64 overflow-y-auto rounded-lg border border-line p-4 grid gap-2">
            {subjects.map((sub) => {
              const isSelected = weakSubjectsWatch.includes(sub.id);
              const isDisabled = goodSubjectsWatch.includes(sub.id);
              return (
                <label key={sub.id} className={`flex items-center space-x-2 text-sm ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleSubjectToggle(sub.id, "weak")}
                    className="rounded border-gray-300 text-brand focus:ring-brand"
                  />
                  <span>{sub.name}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-ink-muted">Select subjects you want help with.</p>
        </Field>

        <Field label="Strong Subjects (Good)">
          <div className="max-h-64 overflow-y-auto rounded-lg border border-line p-4 grid gap-2">
            {subjects.map((sub) => {
              const isSelected = goodSubjectsWatch.includes(sub.id);
              const isDisabled = weakSubjectsWatch.includes(sub.id);
              return (
                <label key={sub.id} className={`flex items-center space-x-2 text-sm ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleSubjectToggle(sub.id, "good")}
                    className="rounded border-gray-300 text-brand focus:ring-brand"
                  />
                  <span>{sub.name}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-ink-muted">Select subjects you can help others with.</p>
        </Field>
      </div>

      <div className="space-y-4">
        <Field label="Education Level">
          <select {...register("level")} className={`${inputClass} max-w-md ${errors.level ? errorClass : ""}`}>
            <option value="">Select level...</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
            {(user?.role === "SENIOR_STUDENT" || user?.role === "TEACHER" || user?.role === "ADMIN") && (
              <option value="more">More...</option>
            )}
          </select>
          {errors.level && <p className="mt-1 text-xs text-danger">{errors.level.message}</p>}
        </Field>

        {levelWatch === "more" && (
          <Field label="Custom Education Level">
            <input
              {...register("custom_level")}
              className={`${inputClass} max-w-md ${errors.custom_level ? errorClass : ""}`}
              placeholder="e.g. PhD in Physics"
            />
            {errors.custom_level && <p className="mt-1 text-xs text-danger">{errors.custom_level.message}</p>}
          </Field>
        )}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-line">
        <Button type="submit" disabled={isSubmitting}>
          {isOnboarding ? "Save & Continue" : "Save Profile"}
        </Button>
        {isOnboarding ? (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={isSubmitting}>
            Skip
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onGoBack} disabled={isSubmitting}>
            Go Back
          </Button>
        )}
      </div>
    </form>
  );
}
