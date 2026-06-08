import { TableCell, TableRow } from '@/components/ui/table'

interface TableSkeletonProps {
  rows?: number
  cols: number
}

export function TableSkeleton({ rows = 6, cols }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + ((i + j) * 17) % 35}%` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
