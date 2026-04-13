import type { BudgetStatus } from '../../types'
import { cn } from '../../lib/utils'
import { STATUS_COLORS } from '../../lib/constants'

interface Props {
  percentage: number
  status: BudgetStatus
  className?: string
  thin?: boolean
}

export function ProgressBar({ percentage, status, className, thin }: Props) {
  const capped = Math.min(percentage, 100)
  return (
    <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', thin ? 'h-1.5' : 'h-2', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-300', STATUS_COLORS[status])}
        style={{ width: `${capped}%` }}
      />
    </div>
  )
}
