import { Skeleton } from "@/components/ui/skeleton";

export default function LessonDetailLoading() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-[60rem] py-2 sm:py-4 space-y-6">
      {/* Top Back Navigation + Author Actions */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Editorial Reader Header */}
      <header className="space-y-4 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <Skeleton className="h-9 w-3/4" />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-52" />
            </div>
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </header>

      {/* Media Preview */}
      <Skeleton className="aspect-video w-full rounded-xl" />

      {/* Borderless Reading Body */}
      <div className="py-1 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Borderless Bottom Reader Action Bar */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/65 pt-4.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </footer>
    </div>
  );
}
