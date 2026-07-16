import { cn } from '@/lib/utils'

// Shadcn-style Skeleton primitive.
// Renders a pulsing grey rectangle matching the target element's dimensions.
// Usage: <Skeleton className="h-4 w-32 rounded" />
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
