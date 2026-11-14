import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServerAuthToken } from "@/lib/auth-server";
import { apiFetch } from "@/services/api-client";
import { PaginatedResponse, SavedSession } from "@/types";
import { formatDate } from "@/lib/utils";
import { CollectionCapacityStrip } from "@/components/features/collections/collection-capacity-strip";
import {
  Bookmark,
  Lock,
  Globe,
  ArrowRight,
  Plus,
  AlertCircle,
  FolderHeart,
} from "lucide-react";

export default async function SavedSessionsPage() {
  const token = await getServerAuthToken();
  
  let mine: SavedSession[] = [];
  if (token) {
    try {
      const res = await apiFetch<PaginatedResponse<SavedSession>>(
        "/saved-sessions/?expand=items",
        token
      );
      mine = res.data || [];
    } catch (error) {
      console.error("Failed to fetch saved sessions:", error);
    }
  }

  const hasEmpty = mine.some((session) => !session.items || session.items.length === 0);
  const atCap = mine.length >= 3;
  const canCreate = Boolean(token) && !atCap && !hasEmpty;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Saved sessions"
        description="Bookmark posts, problems, solutions, lessons, and exam papers across the platform. Up to 3 sessions."
        actions={
          canCreate ? (
            <Button
              nativeButton={false}
              render={<Link href="/saved-sessions/new" />}
              className="gap-2 px-4 py-2 font-medium shadow-xs"
            >
              <Plus className="h-4 w-4" />
              New session
            </Button>
          ) : (
            <Button disabled className="gap-2">
              {atCap ? "Limit reached (3)" : hasEmpty ? "Empty session exists" : "New session"}
            </Button>
          )
        }
      />

      <div className="mt-2 mb-6">
        <SubNav
          items={[
            { href: "/study-plans", label: "Study Plans" },
            { href: "/saved-sessions", label: "Saved Sessions", active: true },
          ]}
        />
      </div>

      {/* Capacity indicator & 3-slot visual header */}
      <CollectionCapacityStrip
        label="Saved Sessions"
        singularLabel="saved session"
        basePath="/saved-sessions"
        collections={mine.map((s) => ({
          id: s.id,
          title: s.title,
          item_count: s.items?.length ?? 0,
        }))}
        hasEmpty={hasEmpty}
        atCap={atCap}
      />

      {mine.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center sm:p-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <FolderHeart className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">No saved sessions yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Create collections of valuable posts, tricky problems, or helpful resources to reference later.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {canCreate && (
              <Button nativeButton={false} render={<Link href="/saved-sessions/new" />} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create your first session
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((s) => {
            const itemCount = s.items?.length || 0;
            const isEmpty = itemCount === 0;

            return (
              <Link
                key={s.id}
                href={`/saved-sessions/${s.id}`}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <Bookmark className="h-5 w-5" />
                    </div>
                    <Badge
                      variant={s.is_public ? "default" : "outline"}
                      className="gap-1 text-[11px] font-normal"
                    >
                      {s.is_public ? (
                        <>
                          <Globe className="h-3 w-3" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" /> Private
                        </>
                      )}
                    </Badge>
                  </div>

                  <h2 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {s.title}
                  </h2>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Created {formatDate(s.created_at)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                  <span
                    className={
                      isEmpty
                        ? "text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"
                        : "text-muted-foreground font-medium"
                    }
                  >
                    {isEmpty ? (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Empty session
                      </>
                    ) : (
                      <>
                        <strong className="text-foreground font-semibold">{itemCount}</strong>{" "}
                        {itemCount === 1 ? "item" : "items"}
                      </>
                    )}
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                    View session <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
