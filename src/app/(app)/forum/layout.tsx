import { ForumSubNav } from "@/components/features/forum/forum-sub-nav";

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <ForumSubNav />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

