import { useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { TransactionCard } from '../components/transactions/TransactionCard'
import { PeriodSelector } from '../components/budget/PeriodSelector'
import { EmptyState } from '../components/ui/EmptyState'
import { useDataStore } from '../store/dataStore'
import { useCurrentPeriod } from '../hooks/usePeriodId'
import { ArrowLeftRight } from 'lucide-react'
import type { TransactionType } from '../types'

type Filter = 'all' | TransactionType

export function TransactionsPage() {
  const { transactions, accounts } = useDataStore()
  const { periodId, period } = useCurrentPeriod()
  const [filter, setFilter] = useState<Filter>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')

  const periodTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.budgetPeriodId !== periodId) return false
        if (filter !== 'all' && t.type !== filter) return false
        if (accountFilter !== 'all' && t.accountId !== accountFilter) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, periodId, filter, accountFilter])

  return (
    <div className="flex flex-col">
      <PageHeader title="Movimientos" right={<PeriodSelector />} subtitle={period?.name} />

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
