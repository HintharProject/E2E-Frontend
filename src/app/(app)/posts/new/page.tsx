import { PageHeader } from "@/components/ui/page-header";
import { currentUser, auth } from "@clerk/nextjs/server";
import { isWriteLocked } from "@/types/user";
import { apiFetch } from "@/services/api-client";
import { Subject, Level, Tag } from "@/types";
import { CreatePostForm } from "@/components/features/posts/create-post-form";

export default async function NewPostPage() {
  const clerkUser = await currentUser();
  const { getToken } = await auth();
  const token = (await getToken()) || "";

  // fallback for UI testing without auth
  const user = clerkUser ? { role: "STUDENT", banState: "ACTIVE" } : { role: "ADMIN", banState: "ACTIVE" }; 

  const subjectRequired = user.role === "STUDENT";
  const writeLocked = isWriteLocked(user.banState as "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN");

  const [subjects, levels, tags] = await Promise.all([
    apiFetch<Subject[]>("/subjects/", ""),
    apiFetch<Level[]>("/levels/", ""),
    apiFetch<Tag[]>("/tags/", token)
  ]).catch((err) => {
    console.error("Failed to load metadata for Create Post form:", err);
    return [[] as Subject[], [] as Level[], [] as Tag[]] as const;
  });

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
        subjects={subjects} 
        levels={levels} 
        tags={tags} 
        userRole={user.role} 
        writeLocked={writeLocked} 
      />
    </div>
  );
}
