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

export function GraduationForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    student_clerk_id: z.string().min(1, "Clerk ID of the old account is required."),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_clerk_id: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      await apiFetch("/users/me/graduate/", token, {
        method: "POST",
        body: JSON.stringify(data),
      });

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setSuccess(true);
      setTimeout(() => {
        router.push("/forum");
      }, 3000);
    } catch (err: any) {
      setServerError(err.message || "Failed to process graduation request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center max-w-lg mx-auto">
        <h3 className="text-xl font-semibold text-green-600 mb-2">Success!</h3>
        <p className="text-ink-muted">Your old account has been successfully linked. Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-line bg-card p-6 max-w-lg mx-auto">
      <FormErrorBanner serverMessage={serverError} />

      <p className="text-sm text-ink-muted mb-4">
        To transition your account, you need to verify ownership of your old Student account.
        Please enter the Clerk ID of your old Student account below. 
        (In a production environment, this would involve a multi-session OAuth verification flow.)
      </p>

      <Field label="Old Student Account Clerk ID">
        <input
          {...register("student_clerk_id")}
          className={`${inputClass} ${errors.student_clerk_id ? errorClass : ""}`}
          placeholder="e.g. user_2P..."
        />
        {errors.student_clerk_id && <p className="mt-1 text-xs text-danger">{errors.student_clerk_id.message}</p>}
      </Field>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          Link Old Account & Graduate
        </Button>
      </div>
    </form>
  );
}
