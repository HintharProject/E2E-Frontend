import { Skeleton } from "@/components/ui/skeleton";

export default function TrainLoading() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background select-none">
      {/* Top Bar Skeleton */}
      <div className="h-14 border-b border-line bg-surface/60 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-5 w-36 rounded-full" />
        </div>
        <Skeleton className="h-8 w-28 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Main Canvas Row Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-line bg-card/40 p-3 space-y-3 hidden lg:block shrink-0">
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="space-y-1.5 pt-2">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          <div className="space-y-1.5 pt-2">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        </div>

        <div className="flex-1 bg-muted/20 flex items-center justify-center p-6">
          <div className="w-full h-full max-w-4xl rounded-2xl border border-line bg-card/60 p-8 flex flex-col items-center justify-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
