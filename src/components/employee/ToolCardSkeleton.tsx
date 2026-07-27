import { Skeleton } from '@/components/ui/skeleton'

export function ToolCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '1px',
        background:
          'linear-gradient(135deg, rgba(29,180,210,0.2) 0%, rgba(11,61,110,0.1) 100%)',
      }}
    >
      <div
        style={{
          borderRadius: '19px',
          overflow: 'hidden',
          background: '#0f172a',
          minHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Skeleton
          className="w-full shrink-0"
          style={{ height: '220px', borderRadius: 0 }}
        />

        <div className="flex flex-col flex-1 gap-3 px-4 pb-4 pt-2">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
          </div>
          <Skeleton className="mt-auto h-10 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
