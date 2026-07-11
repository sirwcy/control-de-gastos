import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { TransactionCard } from '../components/transactions/TransactionCard'
import { PeriodSelector } from '../components/budget/PeriodSelector'
import { EmptyState } from '../components/ui/EmptyState'
import { useDataStore } from '../store/dataStore'
import { useCurrentPeriod } from '../hooks/usePeriodId'
import { getRefLabel } from '../lib/categoryHelpers'
import { ArrowLeftRight, X } from 'lucide-react'
import type { TransactionType, CategoryLevel } from '../types'

type Filter = 'all' | TransactionType

export function TransactionsPage() {
  const { transactions, accounts, categories, subcategories, subSubcategories } = useDataStore()
  const { periodId, period } = useCurrentPeriod()
  const [filter, setFilter] = useState<Filter>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [searchParams, setSearchParams] = useSearchParams()

  // Filtro por categoría (llega desde el Resumen: ?cat=level:id)
  const catParam = searchParams.get('cat')
  const catFilter = useMemo(() => {
    if (!catParam) return null
    const [level, id] = catParam.split(':')
    if (!level || !id) return null
    return { level: level as CategoryLevel, id }
  }, [catParam])

  const catLabel = useMemo(() => {
    if (!catFilter) return null
    const ref = {
      level: catFilter.level,
      categoryId:       catFilter.level === 'category'        ? catFilter.id : '',
      subcategoryId:    catFilter.level === 'subcategory'     ? catFilter.id : undefined,
      subSubcategoryId: catFilter.level === 'sub_subcategory' ? catFilter.id : undefined,
    }
    return getRefLabel(ref, categories, subcategories, subSubcategories)
  }, [catFilter, categories, subcategories, subSubcategories])

  const clearCatFilter = () => {
    searchParams.delete('cat')
    setSearchParams(searchParams, { replace: true })
  }

  const periodTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.budgetPeriodId !== periodId) return false
        if (filter !== 'all' && t.type !== filter) return false
        if (accountFilter !== 'all' && t.accountId !== accountFilter) return false
        if (catFilter) {
          const ref = t.categoryRef
          if (!ref) return false
          if (catFilter.level === 'category'        && ref.categoryId       !== catFilter.id) return false
          if (catFilter.level === 'subcategory'     && ref.subcategoryId    !== catFilter.id) return false
          if (catFilter.level === 'sub_subcategory' && ref.subSubcategoryId !== catFilter.id) return false
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, periodId, filter, accountFilter, catFilter])

  return (
    <div className="flex flex-col">
      <PageHeader title="Movimientos" right={<PeriodSelector />} subtitle={period?.name} />

      {/* Filtro de categoría activo (desde el Resumen) */}
      {catFilter && (
        <div className="px-4 pt-3">
          <button
            onClick={clearCatFilter}
            className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full"
          >
            {catLabel}
            <X size={13} />
          </button>
        </div>
      )}

      {/* Filtros de tipo */}
      <div className="px-4 pt-3 flex gap-2">
        {(['all', 'expense', 'income'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? f === 'income' ? 'bg-emerald-500 text-white' : f === 'expense' ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'expense' ? 'Gastos' : 'Ingresos'}
          </button>
        ))}
      </div>

      {/* Filtro por cuenta */}
      {accounts.length > 1 && (
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setAccountFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${accountFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            Todas las cuentas
          </button>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setAccountFilter(acc.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${accountFilter === acc.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {acc.name}
            </button>
          ))}
        </div>
      )}

      {periodTransactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin movimientos"
          description="Usá el botón + para registrar un gasto o ingreso."
        />
      ) : (
        <div className="px-4 py-4 space-y-2">
          {periodTransactions.map(t => (
            <TransactionCard key={t.id} transaction={t} />
          ))}
        </div>
      )}
    </div>
  )
}
