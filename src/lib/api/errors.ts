export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Client-safe check when ApiError class may not survive serialization. */
export function isApiTimeoutError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.code === "TIMEOUT" || error.status === 408;
  }
  if (error instanceof Error) {
    return (
      error.message.includes("waking up") ||
      error.message.includes("too long to respond")
    );
  }
  return false;
}

export function isApiColdStartError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500;
}
