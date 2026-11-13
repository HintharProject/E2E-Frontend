import { redirect } from "next/navigation";

interface TrainIndexPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Legacy `/train` archive browser has been unified into `/resources`.
 * Redirect cleanly while preserving `level`, `subject`, and `selectForProblem` query params.
 */
export default async function TrainIndexPage({ searchParams }: TrainIndexPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  const forwardParam = (key: string) => {
    const value = resolved[key];
    if (typeof value === "string" && value.trim()) {
      params.set(key, value.trim());
    } else if (Array.isArray(value) && value.length > 0) {
      const joined = value.filter(Boolean).join(",");
      if (joined) params.set(key, joined);
    }
  };

  forwardParam("level");
  forwardParam("subject");
  forwardParam("selectForProblem");

  const qs = params.toString();
  redirect(qs ? `/resources?${qs}` : "/resources");
}
