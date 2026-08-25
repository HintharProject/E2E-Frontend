import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@clerk/nextjs/server";
import { isWriteLocked } from "@/types/user";
import { CreatePostForm } from "@/components/features/posts/create-post-form";

export default async function NewPostPage() {
  const { userId } = await auth();

  // fallback for UI testing without auth
  const user = userId ? { role: "STUDENT", banState: "ACTIVE" } : { role: "ADMIN", banState: "ACTIVE" }; 

  const subjectRequired = user.role === "STUDENT";
  const writeLocked = isWriteLocked(user.banState as "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN");

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
        userRole={user.role} 
        writeLocked={writeLocked} 
      />
    </div>
  );
}
