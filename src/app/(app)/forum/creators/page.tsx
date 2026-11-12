import { ForumFeed } from "@/components/features/forum-feed";

export default function CreatorsFeedPage() {
  return (
    <div className="w-full">
      <ForumFeed 
        subjects={[]} 
        levels={[]} 
        tagIds={[]} 
        postTypes={[]} 
        feed="creator"
      />
    </div>
  );
}
