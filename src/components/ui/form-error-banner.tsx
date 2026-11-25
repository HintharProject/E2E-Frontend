import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormErrorBannerProps {
  serverMessage?: string;
  fieldErrors?: Record<string, string[]>;
  className?: string;
}

export const FormErrorBanner = React.forwardRef<
  HTMLDivElement,
  FormErrorBannerProps
>(function FormErrorBanner({ serverMessage, fieldErrors, className }, ref) {
  if (!serverMessage && (!fieldErrors || Object.keys(fieldErrors).length === 0)) {
    return null;
  }

  const entries = fieldErrors
    ? Object.entries(fieldErrors).filter(([, msgs]) => msgs && msgs.length > 0)
    : [];

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          {serverMessage && <p className="font-semibold">{serverMessage}</p>}
          {entries.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-xs">
              {entries.map(([field, msgs]) => (
                <li key={field}>
                  <span className="font-medium capitalize">
                    {field.replace(/_id$/i, "").replace(/_/g, " ")}:{" "}
                  </span>
                  {msgs.join(", ")}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
});

FormErrorBanner.displayName = "FormErrorBanner";
