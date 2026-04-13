import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CategoryRollup, SubcategoryRollup, AppSettings } from '../../types'
import { ProgressBar } from '../ui/ProgressBar'
import { CategoryIcon } from '../categories/CategoryIcon'
import { formatCurrencyFull } from '../../lib/formatters'
import { STATUS_TEXT_COLORS } from '../../lib/constants'
import { cn } from '../../lib/utils'

interface Props {
  rollup: CategoryRollup
  settings: AppSettings
}

export function CategoryRollupRow({ rollup, settings }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { category, budgeted, spent, percentage, status, subcategories } = rollup

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Fila categoría */}
      <button
        onClick={() => subcategories.length > 0 && setExpanded(e => !e)}
        className="w-full px-4 py-4 flex items-center gap-3"
      >
        <CategoryIcon name={category.icon} color={category.color} size={18} />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-800">{category.name}</span>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold', STATUS_TEXT_COLORS[status])}>
                {percentage}%
              </span>
              {subcategories.length > 0 && (
                expanded
                  ? <ChevronDown size={15} className="text-slate-400" />
                  : <ChevronRight size={15} className="text-slate-400" />
              )}
            </div>
          </div>
          <ProgressBar percentage={percentage} status={status} thin />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-500">{formatCurrencyFull(spent, settings)} gastado</span>
            <span className="text-xs text-slate-400">{formatCurrencyFull(budgeted, settings)}</span>
          </div>
        </div>
      </button>

      {/* Subcategorías */}
      {expanded && subcategories.map(subRollup => (
        <SubcategoryRow key={subRollup.subcategory.id} rollup={subRollup} settings={settings} color={category.color} />
      ))}
    </div>
  )
}

function SubcategoryRow({ rollup, settings, color }: { rollup: SubcategoryRollup; settings: AppSettings; color: string }) {
  const [expanded, setExpanded] = useState(false)
  const { subcategory, budgeted, spent, percentage, status, subSubcategories } = rollup

  return (
    <div className="border-t border-slate-50">
      <button
        onClick={() => subSubcategories.length > 0 && setExpanded(e => !e)}
        className="w-full pl-14 pr-4 py-3 flex items-center gap-3"
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700">{subcategory.name}</span>
            <div className="flex items-center gap-1.5">
              <span className={cn('text-xs font-semibold', STATUS_TEXT_COLORS[status])}>{percentage}%</span>
              {subSubcategories.length > 0 && (
                expanded
                  ? <ChevronDown size={13} className="text-slate-300" />
                  : <ChevronRight size={13} className="text-slate-300" />
              )}
            </div>
          </div>
          <ProgressBar percentage={percentage} status={status} thin />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-400">{formatCurrencyFull(spent, settings)}</span>
            <span className="text-xs text-slate-300">{formatCurrencyFull(budgeted, settings)}</span>
          </div>
        </div>
      </button>

      {expanded && subSubcategories.map(ssRollup => (
        <div key={ssRollup.subSubcategory.id} className="border-t border-slate-50 pl-20 pr-4 py-2.5 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0" />
            <span className="text-xs text-slate-600 flex-1 truncate">{ssRollup.subSubcategory.name}</span>
            <span className={cn('text-xs font-semibold', STATUS_TEXT_COLORS[ssRollup.status])}>
              {ssRollup.percentage}%
            </span>
          </div>
          <ProgressBar percentage={ssRollup.percentage} status={ssRollup.status} thin />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-400">{formatCurrencyFull(ssRollup.spent, settings)}</span>
            <span className="text-xs text-slate-300">{formatCurrencyFull(ssRollup.budgeted, settings)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
