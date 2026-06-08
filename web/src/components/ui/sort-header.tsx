import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'

interface SortHeaderProps {
  label: string
  col: string
  current: string
  dir: 'asc' | 'desc'
  onSort: (col: string) => void
  className?: string
}

export function SortHeader({ label, col, current, dir, onSort, className }: SortHeaderProps) {
  const active = current === col
  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/40 transition-colors ${className ?? ''}`}
      onClick={() => onSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? dir === 'asc'
            ? <ChevronUp className="h-3.5 w-3.5 text-primary" />
            : <ChevronDown className="h-3.5 w-3.5 text-primary" />
          : <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
        }
      </div>
    </TableHead>
  )
}
