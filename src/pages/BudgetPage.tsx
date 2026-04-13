import { Plus } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { PeriodSelector } from '../components/budget/PeriodSelector'
import { BudgetItemList } from '../components/budget/BudgetItemList'
import { BudgetItemFormSheet } from '../components/budget/BudgetItemFormSheet'
import { useUIStore } from '../store/uiStore'
import { useCurrentPeriod } from '../hooks/usePeriodId'

export function BudgetPage() {
  const { periodId, period } = useCurrentPeriod()
  const openAddBudgetItem = useUIStore(s => s.openAddBudgetItem)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Presupuesto"
        subtitle={period?.name}
        right={
          <div className="flex items-center gap-2">
            <PeriodSelector />
            <button
              onClick={openAddBudgetItem}
              className="flex items-center gap-1 bg-brand-500 text-white text-sm font-medium px-3 py-1.5 rounded-xl"
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
        }
      />
      <BudgetItemList periodId={periodId} />
      <BudgetItemFormSheet periodId={periodId} />
    </div>
  )
}
