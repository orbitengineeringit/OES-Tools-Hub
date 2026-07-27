import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'

interface TableRowSkeletonProps {
  rows?: number
  cols?: number
}

export function TableRowSkeleton({ rows = 5, cols = 5 }: TableRowSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton
                className={`h-4 rounded ${colIdx === 0 ? 'w-32' : colIdx === cols - 1 ? 'w-16' : 'w-24'}`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
