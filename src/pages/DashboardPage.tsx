import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { PeriodSelector } from '../components/budget/PeriodSelector'
import { TotalSummaryCard } from '../components/dashboard/TotalSummaryCard'
import { CategoryRollupRow } from '../components/dashboard/CategoryRollupRow'
import { EmptyState } from '../components/ui/EmptyState'
import { LayoutDashboard } from 'lucide-react'
import { useDataStore } from '../store/dataStore'
import { useCurrentPeriod } from '../hooks/usePeriodId'
import { computeDashboard } from '../lib/calculations'

export function DashboardPage() {
  const { categories, subcategories, subSubcategories, budgetItems, transactions, settings } = useDataStore()
  const { periodId, period } = useCurrentPeriod()

  const dashboard = useMemo(() => {
    if (!periodId) return null
    return computeDashboard({
      categories,
      subcategories,
      subSubcategories,
      budgetItems,
      transactions,
      periodId,
      warningThreshold: settings.warningThreshold,
    })
  }, [categories, subcategories, subSubcategories, budgetItems, transactions, periodId, settings.warningThreshold])

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Resumen"
        subtitle={period?.name}
        right={
          <div className="flex items-center gap-2">
            <PeriodSelector />
            <Link to="/config" className="p-1.5 text-slate-400">
              <Settings size={20} />
            </Link>
          </div>
        }
      />

      {!dashboard || dashboard.rollups.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Sin datos aún"
          description="Creá un presupuesto y registrá tus gastos para ver el resumen aquí."
        />
      ) : (
        <div className="px-4 py-4 space-y-3">
          <TotalSummaryCard summary={dashboard} settings={settings} />
          <div className="space-y-2">
            {dashboard.rollups.map(rollup => (
              <CategoryRollupRow key={rollup.category.id} rollup={rollup} settings={settings} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
