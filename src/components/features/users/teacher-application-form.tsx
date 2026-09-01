"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { useQueryClient } from "@tanstack/react-query";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const errorClass = "border-danger focus:ring-danger/20";

export function TeacherApplicationForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    years_of_experience: z.number().min(0, "Must be a positive number"),
    subject_specialization: z.string().min(1, "Specialization is required"),
    additional_info: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      years_of_experience: 0,
      subject_specialization: "",
      additional_info: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      await apiFetch("/users/teacher-applications/", token, {
        method: "POST",
        body: JSON.stringify(data),
      });

      queryClient.invalidateQueries({ queryKey: ["teacherApplications"] });
      onSuccess();
    } catch (err: any) {
      setServerError(err.message || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <FormErrorBanner serverMessage={serverError} />

      <Field label="Years of Experience">
        <input
          type="number"
          {...register("years_of_experience", { valueAsNumber: true })}
          className={`${inputClass} ${errors.years_of_experience ? errorClass : ""}`}
        />
        {errors.years_of_experience && <p className="mt-1 text-xs text-danger">{errors.years_of_experience.message}</p>}
      </Field>

      <Field label="Subject Specialization">
        <input
          {...register("subject_specialization")}
          className={`${inputClass} ${errors.subject_specialization ? errorClass : ""}`}
          placeholder="e.g. Mathematics, Physics"
        />
        {errors.subject_specialization && <p className="mt-1 text-xs text-danger">{errors.subject_specialization.message}</p>}
      </Field>

      <Field label="Additional Information (Optional)">
        <textarea
          {...register("additional_info")}
          className={`${inputClass} min-h-32 ${errors.additional_info ? errorClass : ""}`}
          placeholder="Tell us about your teaching experience..."
        />
        {errors.additional_info && <p className="mt-1 text-xs text-danger">{errors.additional_info.message}</p>}
      </Field>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          Submit Application
        </Button>
      </div>
    </form>
  );
}
