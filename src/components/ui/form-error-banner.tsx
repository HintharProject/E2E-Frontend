import React from "react";
import { AlertCircle } from "lucide-react";

interface FormErrorBannerProps {
  serverMessage?: string;
  fieldErrors?: Record<string, string[]>;
  className?: string;
}

export function FormErrorBanner({
  serverMessage,
  fieldErrors,
  className = "",
}: FormErrorBannerProps) {
  if (!serverMessage && (!fieldErrors || Object.keys(fieldErrors).length === 0)) {
    return null;
  }

  const entries = fieldErrors
    ? Object.entries(fieldErrors).filter(([_, msgs]) => msgs && msgs.length > 0)
    : [];

  return (
    <div
      role="alert"
      className={`rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="space-y-1 text-sm">
          {serverMessage && <p className="font-semibold">{serverMessage}</p>}
          {entries.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-xs opacity-90">
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
}
