import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "@/services/api-client";
import { Problem, Subject, Level } from "@/types";
import { isWriteLocked } from "@/types/user";
import { fetchCurrentUser } from "@/services/user-service";
import { UpdateProblemForm } from "@/components/features/problems/update-problem-form";
import { getServerAuthToken } from "@/lib/auth-server";

export default async function EditProblemPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const token = await getServerAuthToken();
  
  if (!token) notFound();

  let problem: Problem;
  try {
    problem = await apiFetch<Problem>(`/problems/${id}/`, token);
  } catch (error) {
    notFound();
  }
  
  const user = await fetchCurrentUser(token).catch(() => null);
  
  if (!user) {
    notFound();
  }

  // Verify permissions: only author or admin can edit
  if (user.role !== "ADMIN" && problem.author !== user.id) {
    notFound();
  }

  const writeLocked = isWriteLocked(user.ban_state);

  const [subjects, levels] = await Promise.all([
    apiFetch<Subject[]>("/subjects/", token),
    apiFetch<Level[]>("/levels/", token),
  ]).catch(() => [
    [] as Subject[],
    [] as Level[],
  ] as [Subject[], Level[]]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="Edit problem" description="Update your problem details." />
      <UpdateProblemForm
        problem={problem}
        subjects={subjects}
        levels={levels}
        writeLocked={writeLocked}
      />
    </div>
  );
}
