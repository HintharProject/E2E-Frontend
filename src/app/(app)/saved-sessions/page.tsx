import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "@/services/api-client";
import { PaginatedResponse, SavedSession } from "@/types";

export default async function SavedSessionsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  let mine: SavedSession[] = [];
  try {
    const res = await apiFetch<PaginatedResponse<SavedSession>>("/saved-sessions/?expand=items", token ?? "");
    mine = res.data;
  } catch (error) {
    console.error("Failed to fetch saved sessions:", error);
  }

  const hasEmpty = mine.some(session => !session.items || session.items.length === 0);
  const atCap = mine.length >= 12;
  const canCreate = !atCap && !hasEmpty;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Saved sessions"
        description="Up to 12 sessions of posts, problems, solutions, lessons, and past papers."
        actions={
          <Button disabled={!canCreate} nativeButton={false} render={canCreate ? <Link href="/saved-sessions/new" /> : undefined}>
            {atCap ? "Limit reached (12)" : hasEmpty ? "Empty session exists" : "New session"}
          </Button>
        }
      />
      <SubNav
        items={[
          { href: "/study-plans", label: "Study Plans" },
          { href: "/saved-sessions", label: "Saved Sessions", active: true },
        ]}
      />
      {mine.length === 0 ? (
        <EmptyState
          title="No saved sessions"
          description="Save discussions, problems, solutions, lessons, and past papers while studying."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mine.map((session) => {
            const totalItems = session.items?.length || 0;
            return (
              <Link
                key={session.id}
                href={`/saved-sessions/${session.id}`}
                className="rounded-2xl border border-line bg-card p-5 transition hover:border-brand/40 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl text-ink font-semibold">{session.title}</h2>
                  <Badge variant={session.is_public ? "default" : "outline"}>
                    {session.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  {totalItems} {totalItems === 1 ? "item" : "items"} saved
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

