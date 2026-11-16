import { currentUser } from "@clerk/nextjs/server";
import { getServerAuthToken } from "@/lib/auth-server";
import { API_BASE_URL } from "@/lib/constants";
import AppLayout from "@/app/(app)/layout";
import { AcademicHub } from "@/components/features/home/academic-hub";
import { LandingPage } from "@/components/features/landing/landing-page";
import type { Problem, Resource, Subject } from "@/types";

function unwrapArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as { data?: unknown; results?: unknown };
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
}

async function fetchPublicSnapshot<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return unwrapArray<T>(json);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const token = await getServerAuthToken();
  if (token) {
    return (
      <AppLayout>
        <AcademicHub />
      </AppLayout>
    );
  }

  let hasClerkUser = false;
  try {
    const user = await currentUser();
    hasClerkUser = Boolean(user);
  } catch {
    // Ignore auth lookup errors for public visitors
  }

  if (hasClerkUser) {
    return (
      <AppLayout>
        <AcademicHub />
      </AppLayout>
    );
  }

  const [initialProblems, initialPapers, initialSubjects] = await Promise.all([
    fetchPublicSnapshot<Problem>("/problems/?page_size=4&expand=subject_details,level_details"),
    fetchPublicSnapshot<Resource>("/resources/files/?resource_type=PAST_PAPER&page_size=4"),
    fetchPublicSnapshot<Subject>("/subjects/"),
  ]);

  return (
    <LandingPage
      initialProblems={initialProblems}
      initialPapers={initialPapers}
      initialSubjects={initialSubjects}
    />
  );
}
