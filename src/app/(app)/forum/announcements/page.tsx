import { AnnouncementsFeed } from "@/components/features/forum/announcements-feed";

export default function AnnouncementsFeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-3 sm:px-6">
      {/* Dedicated Announcements Feed */}
      <AnnouncementsFeed />
    </div>
  );
}
