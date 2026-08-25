import { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { ApiError } from "@/services/api-client";

export interface FormErrorMapping {
  [backendField: string]: string; // Maps backend field name to frontend form field name
}

export interface ExtractedFormErrors {
  serverMessage: string;
  fieldErrors: Record<string, string[]>;
  failedFieldLabels: string[];
}

/**
 * Capitalizes and formats field names nicely (e.g. subject_id -> Subject, uploaded_attachments -> Attachments)
 */
export function formatFieldLabel(fieldName: string): string {
  const clean = fieldName.replace(/_id$/i, "").replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Extracts and maps backend validation error details into a structured format.
 */
export function extractApiFieldErrors(
  error: unknown,
  fieldMapping: FormErrorMapping = {},
  defaultMessage: string = "Validation failed. Please check your inputs."
): ExtractedFormErrors {
  const fieldErrors: Record<string, string[]> = {};
  const failedFieldLabels: string[] = [];
  let serverMessage = defaultMessage;

  if (error instanceof ApiError) {
    if (error.message && error.message !== "Invalid input." && !error.message.startsWith("Request failed")) {
      serverMessage = error.message;
    }

    if (error.details && typeof error.details === "object" && !Array.isArray(error.details)) {
      for (const [backendKey, val] of Object.entries(error.details)) {
        if (backendKey === "detail" || backendKey === "non_field_errors") {
          const msg = Array.isArray(val) ? val.join(" ") : String(val);
          serverMessage = msg;
          continue;
        }

        const targetField = fieldMapping[backendKey] || backendKey;
        const messages = Array.isArray(val) ? val.map(String) : [String(val)];

        if (!fieldErrors[targetField]) {
          fieldErrors[targetField] = [];
        }
        fieldErrors[targetField].push(...messages);

        const label = formatFieldLabel(targetField);
        if (!failedFieldLabels.includes(label)) {
          failedFieldLabels.push(label);
        }
      }
    } else if (Array.isArray(error.details) && error.details.length > 0) {
      serverMessage = error.details.map(String).join(" ");
    }
  } else if (error instanceof Error) {
    serverMessage = error.message;
  }

  return {
    serverMessage,
    fieldErrors,
    failedFieldLabels,
  };
}

/**
 * Applies extracted field errors into React Hook Form via setError.
 */
export function applyFieldErrorsToForm<T extends FieldValues>(
  fieldErrors: Record<string, string[]>,
  setError: UseFormSetError<T>
) {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages.length > 0) {
      setError(field as Path<T>, {
        type: "server",
        message: messages.join(" "),
      });
    }
  }
}
