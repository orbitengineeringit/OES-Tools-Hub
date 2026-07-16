import { Skeleton } from '@/components/ui/skeleton'

// Skeleton placeholder matching the exact dimensions and layout of ToolCard.
// Shown in a grid during dashboard loading — never a bare spinner for list content (UI_GUIDELINES.md §9).
export function ToolCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 bg-white rounded-xl border border-border p-4">
      {/* Header row: thumbnail + external link icon */}
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <Skeleton className="h-4 w-4 rounded mt-0.5 shrink-0" />
      </div>

      {/* Title + description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
      </div>

      {/* Category badge */}
      <div className="mt-auto">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}
