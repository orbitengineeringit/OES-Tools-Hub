import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'

interface TableRowSkeletonProps {
  // Number of skeleton rows to render (default 5)
  rows?: number
  // Number of columns — determines how many skeleton cells per row
  cols?: number
}

// Skeleton placeholder for table bodies.
// Replace spinner/Loader2 with this during isLoading states.
// Match rows/cols to the real table's column count.
export function TableRowSkeleton({ rows = 5, cols = 5 }: TableRowSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton
                // Vary widths slightly so skeleton looks organic, not mechanical
                className={`h-4 rounded ${colIdx === 0 ? 'w-32' : colIdx === cols - 1 ? 'w-16' : 'w-24'}`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
