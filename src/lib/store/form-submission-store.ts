import { create } from "zustand";
import { toast } from "sonner";
import { extractApiFieldErrors, FormErrorMapping } from "@/lib/form-errors";

export interface FailedSubmissionState {
  key: string;
  formValues: Record<string, any>;
  files?: File[];
  fieldErrors: Record<string, string[]>;
  serverMessage: string;
  returnUrl: string;
  timestamp: number;
}

interface FormSubmissionStore {
  failedSubmissions: Record<string, FailedSubmissionState>;
  
  startBackgroundSubmission: <T>(params: {
    key: string;
    loadingMessage: string;
    successMessage: string;
    returnUrl: string;
    formValues: Record<string, any>;
    files?: File[];
    fieldMapping?: FormErrorMapping;
    execute: () => Promise<T>;
    onSuccessUrl?: (res: T) => string;
    onSuccess?: (res: T) => void;
    onFailure?: (err: any) => void;
    router: { push: (url: string) => void; refresh?: () => void };
  }) => Promise<void>;

  getFailedSubmission: (key: string) => FailedSubmissionState | undefined;
  clearFailedSubmission: (key: string) => void;
}

export const useFormSubmissionStore = create<FormSubmissionStore>((set, get) => ({
  failedSubmissions: {},

  startBackgroundSubmission: async ({
    key,
    loadingMessage,
    successMessage,
    returnUrl,
    formValues,
    files,
    fieldMapping = {},
    execute,
    onSuccessUrl,
    onSuccess,
    onFailure,
    router,
  }) => {
    // Clear any previous failed state for this key when new submission begins
    set((state) => {
      const next = { ...state.failedSubmissions };
      delete next[key];
      return { failedSubmissions: next };
    });

    const toastId = toast.loading(loadingMessage);

    try {
      const res = await execute();
      
      const targetUrl = onSuccessUrl ? onSuccessUrl(res) : undefined;
      
      toast.success(successMessage, {
        id: toastId,
        ...(targetUrl && {
          action: {
            label: "View",
            onClick: () => router.push(targetUrl),
          },
        }),
      });

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      const { serverMessage, fieldErrors, failedFieldLabels } = extractApiFieldErrors(
        err,
        fieldMapping
      );

      // Persist in-memory state with files and validation errors
      set((state) => ({
        failedSubmissions: {
          ...state.failedSubmissions,
          [key]: {
            key,
            formValues,
            files,
            fieldErrors,
            serverMessage,
            returnUrl,
            timestamp: Date.now(),
          },
        },
      }));

      const errorLabel = failedFieldLabels.length > 0
        ? `Please fix errors in ${failedFieldLabels.join(", ")}`
        : serverMessage;

      toast.error(`Submission failed: ${errorLabel}`, {
        id: toastId,
        duration: 8000,
        action: {
          label: "Open & Fix",
          onClick: () => router.push(returnUrl),
        },
      });

      if (onFailure) {
        onFailure(err);
      }
    }
  },

  getFailedSubmission: (key: string) => {
    return get().failedSubmissions[key];
  },

  clearFailedSubmission: (key: string) => {
    set((state) => {
      const next = { ...state.failedSubmissions };
      delete next[key];
      return { failedSubmissions: next };
    });
  },
}));
