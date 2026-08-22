import { PageHeader } from "@/components/ui/page-header";
import { currentUser } from "@clerk/nextjs/server";
import { isWriteLocked } from "@/types/user";
import { apiFetch } from "@/services/api-client";
import { PaginatedResponse, Subject, Level, Tag } from "@/types";
import { CreatePostForm } from "@/components/features/posts/create-post-form";

export default async function NewPostPage() {
  const clerkUser = await currentUser();
  // fallback for UI testing without auth
  const user = clerkUser ? { role: "STUDENT", banState: "ACTIVE" } : { role: "ADMIN", banState: "ACTIVE" }; 

  const subjectRequired = user.role === "STUDENT";
  const writeLocked = isWriteLocked(user.banState as "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN");

  const [subjectsRes, levelsRes, tagsRes] = await Promise.all([
    apiFetch<PaginatedResponse<Subject>>("/subjects/", ""),
    apiFetch<PaginatedResponse<Level>>("/levels/", ""),
    apiFetch<PaginatedResponse<Tag>>("/tags/", "")
  ]).catch(() => [
    { data: [] as Subject[] },
    { data: [] as Level[] },
    { data: [] as Tag[] }
  ] as const);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="New post"
        description={
          subjectRequired
            ? "Students must pick Question or Sharing, plus Subject and Level."
            : "Creators and Admins may post Announcements and omit Subject/Level."
        }
      />
      
      <CreatePostForm 
        subjects={subjectsRes.data} 
        levels={levelsRes.data} 
        tags={tagsRes.data} 
        userRole={user.role} 
        writeLocked={writeLocked} 
      />
    </div>
  );
}
