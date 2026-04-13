import type { DashboardSummary, AppSettings } from '../../types'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrencyFull } from '../../lib/formatters'
import { STATUS_TEXT_COLORS } from '../../lib/constants'

interface Props {
  summary: DashboardSummary
  settings: AppSettings
}

export function TotalSummaryCard({ summary, settings }: Props) {
  const { totalBudgeted, totalSpent, totalPercentage, totalStatus } = summary
  const remaining = totalBudgeted - totalSpent

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Total gastado</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrencyFull(totalSpent, settings)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-0.5">Presupuestado</p>
          <p className="text-base font-semibold text-slate-500">{formatCurrencyFull(totalBudgeted, settings)}</p>
        </div>
      </div>

      <ProgressBar percentage={totalPercentage} status={totalStatus} className="mb-3" />

      <div className="flex justify-between">
        <span className={`text-xs font-semibold ${STATUS_TEXT_COLORS[totalStatus]}`}>
          {totalPercentage}% utilizado
        </span>
        <span className={`text-xs font-semibold ${remaining >= 0 ? 'text-slate-500' : 'text-red-500'}`}>
          {remaining >= 0 ? `${formatCurrencyFull(remaining, settings)} disponible` : `${formatCurrencyFull(Math.abs(remaining), settings)} excedido`}
        </span>
      </div>
    </div>
  )
}
