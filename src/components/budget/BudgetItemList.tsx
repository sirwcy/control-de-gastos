import { useMemo, useState } from 'react'
import { Trash2, PieChart, ChevronDown, ChevronRight } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import type { BudgetItem, BudgetStatus, AppSettings } from '../../types'
import { formatCurrencyFull } from '../../lib/formatters'
import { STATUS_TEXT_COLORS } from '../../lib/constants'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmptyState } from '../ui/EmptyState'
import { CategoryIcon } from '../categories/CategoryIcon'
import { ProgressBar } from '../ui/ProgressBar'

interface Props {
  periodId: string
}

function computeStatus(spent: number, budgeted: number, threshold: number): BudgetStatus {
  if (budgeted === 0) return spent > 0 ? 'unbudgeted' : 'ok'
  const pct = spent / budgeted
  if (pct > 1.0) return 'over'
  if (pct >= threshold) return 'warning'
  return 'ok'
}

function pct(spent: number, budgeted: number) {
  return budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0
}

interface ItemRowProps {
  label: string
  budgeted: number
  spent: number
  item: BudgetItem
  threshold: number
  settings: AppSettings
  onDelete: (item: BudgetItem) => void
  indent?: number
}

function ItemRow({ label, budgeted, spent, item, threshold, settings, onDelete, indent = 0 }: ItemRowProps) {
  const status    = computeStatus(spent, budgeted, threshold)
  const remaining = budgeted - spent
  const percentage = pct(spent, budgeted)

  return (
    <div className="py-2.5" style={{ paddingLeft: `${indent}px` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="flex-1 text-xs text-slate-600 truncate">{label}</span>
        <span className={`text-xs font-bold ${STATUS_TEXT_COLORS[status]} flex-shrink-0`}>
          {formatCurrencyFull(spent, settings)}
          <span className="text-slate-400 font-normal"> / {formatCurrencyFull(budgeted, settings)}</span>
        </span>
        <button onClick={() => onDelete(item)} className="text-slate-200 flex-shrink-0">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <ProgressBar percentage={percentage} status={status} thin className="flex-1" />
        <span className={`text-[10px] font-bold w-7 text-right flex-shrink-0 ${STATUS_TEXT_COLORS[status]}`}>
          {percentage}%
        </span>
        <span className={`text-[10px] flex-shrink-0 ${remaining >= 0 ? 'text-slate-400' : 'text-red-500 font-semibold'}`}>
          {remaining >= 0 ? `${formatCurrencyFull(remaining, settings)} libre` : `${formatCurrencyFull(Math.abs(remaining), settings)} excedido`}
        </span>
      </div>
    </div>
  )
}

export function BudgetItemList({ periodId }: Props) {
  const { budgetItems, deleteBudgetItem, categories, subcategories, subSubcategories, transactions, settings } = useDataStore()
  const [deleting, setDeleting] = useState<BudgetItem | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleCollapse = (key: string) =>
    setCollapsed(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })

  // Mapa de gastos por cada nivel del período actual
  const { byCat, bySub, bySubSub } = useMemo(() => {
    const byCat    = new Map<string, number>()
    const bySub    = new Map<string, number>()
    const bySubSub = new Map<string, number>()
    for (const t of transactions) {
      if (t.budgetPeriodId !== periodId || t.type !== 'expense' || !t.categoryRef) continue
      const { level, categoryId, subcategoryId, subSubcategoryId } = t.categoryRef
      if (level === 'category')
        byCat.set(categoryId, (byCat.get(categoryId) ?? 0) + t.amount)
      else if (level === 'subcategory')
        bySub.set(subcategoryId!, (bySub.get(subcategoryId!) ?? 0) + t.amount)
      else
        bySubSub.set(subSubcategoryId!, (bySubSub.get(subSubcategoryId!) ?? 0) + t.amount)
    }
    return { byCat, bySub, bySubSub }
  }, [transactions, periodId])

  // Ítems del período
  const periodItems = useMemo(
    () => budgetItems.filter(b => b.budgetPeriodId === periodId),
    [budgetItems, periodId]
  )

  // Construir árbol por categoría
  const tree = useMemo(() => {
    if (periodItems.length === 0) return []

    const catIds = [...new Set(periodItems.map(i => i.categoryRef.categoryId))]
    const orderedCats = categories
      .filter(c => catIds.includes(c.id))
      .sort((a, b) => a.order - b.order)

    return orderedCats.map(cat => {
      const catDirectItems = periodItems.filter(i => i.categoryRef.level === 'category' && i.categoryRef.categoryId === cat.id)

      // Subcategorías con ítems
      const subIds = [...new Set(
        periodItems
          .filter(i => i.categoryRef.categoryId === cat.id && i.categoryRef.level !== 'category')
          .map(i => i.categoryRef.subcategoryId!)
      )]
      const orderedSubs = subcategories
        .filter(s => subIds.includes(s.id))
        .sort((a, b) => a.order - b.order)

      const subTree = orderedSubs.map(sub => {
        const subDirectItems = periodItems.filter(i => i.categoryRef.level === 'subcategory' && i.categoryRef.subcategoryId === sub.id)

        // Sub-subcategorías con ítems
        const ssIds = [...new Set(
          periodItems
            .filter(i => i.categoryRef.subcategoryId === sub.id && i.categoryRef.level === 'sub_subcategory')
            .map(i => i.categoryRef.subSubcategoryId!)
        )]
        const orderedSS = subSubcategories
          .filter(ss => ssIds.includes(ss.id))
          .sort((a, b) => a.order - b.order)

        const ssTree = orderedSS.map(ss => {
          const ssItems = periodItems.filter(i => i.categoryRef.subSubcategoryId === ss.id)
          const ssBudgeted = ssItems.reduce((s, i) => s + i.amount, 0)
          const ssSpent    = bySubSub.get(ss.id) ?? 0
          return { ss, ssItems, ssBudgeted, ssSpent }
        })

        const subBudgeted = subDirectItems.reduce((s, i) => s + i.amount, 0) + ssTree.reduce((s, n) => s + n.ssBudgeted, 0)
        const subSpent    = (bySub.get(sub.id) ?? 0) + ssTree.reduce((s, n) => s + n.ssSpent, 0)
        return { sub, subDirectItems, ssTree, subBudgeted, subSpent }
      })

      const catBudgeted = catDirectItems.reduce((s, i) => s + i.amount, 0) + subTree.reduce((s, n) => s + n.subBudgeted, 0)
      const catSpent    = (byCat.get(cat.id) ?? 0) + subTree.reduce((s, n) => s + n.subSpent, 0)
      return { cat, catDirectItems, subTree, catBudgeted, catSpent }
    })
  }, [periodItems, categories, subcategories, subSubcategories, byCat, bySub, bySubSub])

  if (periodItems.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="Sin ítems de presupuesto"
        description="Tocá 'Agregar' para asignar montos a tus categorías."
      />
    )
  }

  const totalBudgeted = tree.reduce((s, n) => s + n.catBudgeted, 0)
  const totalSpent    = tree.reduce((s, n) => s + n.catSpent, 0)
  const totalStatus   = computeStatus(totalSpent, totalBudgeted, settings.warningThreshold)
  const totalPct      = pct(totalSpent, totalBudgeted)
  const totalRemaining = totalBudgeted - totalSpent

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Resumen total */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Total gastado</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrencyFull(totalSpent, settings)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Presupuestado</p>
            <p className="text-base font-semibold text-slate-500">{formatCurrencyFull(totalBudgeted, settings)}</p>
          </div>
        </div>
        <ProgressBar percentage={totalPct} status={totalStatus} />
        <div className="flex justify-between">
          <span className={`text-xs font-semibold ${STATUS_TEXT_COLORS[totalStatus]}`}>
            {totalPct}% utilizado
          </span>
          <span className={`text-xs font-semibold ${totalRemaining >= 0 ? 'text-slate-500' : 'text-red-500'}`}>
            {totalRemaining >= 0
              ? `${formatCurrencyFull(totalRemaining, settings)} disponible`
              : `${formatCurrencyFull(Math.abs(totalRemaining), settings)} excedido`}
          </span>
        </div>
      </div>

      {/* Árbol de categorías */}
      {tree.map(({ cat, catDirectItems, subTree, catBudgeted, catSpent }) => {
        const catStatus  = computeStatus(catSpent, catBudgeted, settings.warningThreshold)
        const catPct     = pct(catSpent, catBudgeted)
        const catKey     = `cat-${cat.id}`
        const isCollapsed = collapsed.has(catKey)
        const catDirectItem = catDirectItems[0]
        const hasChildren = subTree.length > 0

        return (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Cabecera de categoría */}
            <div className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
              <button
                onClick={() => toggleCollapse(catKey)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <CategoryIcon name={cat.icon} color={cat.color} size={18} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800 flex-1">{cat.name}</span>
                    <span className={`text-xs font-bold ${STATUS_TEXT_COLORS[catStatus]}`}>
                      {formatCurrencyFull(catSpent, settings)}
                      <span className="text-slate-400 font-normal"> / {formatCurrencyFull(catBudgeted, settings)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar percentage={catPct} status={catStatus} thin className="flex-1" />
                    <span className={`text-[10px] font-bold ${STATUS_TEXT_COLORS[catStatus]}`}>{catPct}%</span>
                  </div>
                </div>
              </button>
              {catDirectItem && (
                <button onClick={() => setDeleting(catDirectItem)} className="text-slate-200 flex-shrink-0" title="Eliminar presupuesto de la categoría">
                  <Trash2 size={14} />
                </button>
              )}
              {hasChildren && (
                <button onClick={() => toggleCollapse(catKey)} className="text-slate-300 flex-shrink-0">
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>

            {!isCollapsed && hasChildren && (
              <div className="divide-y divide-slate-50">
                {/* Subcategorías */}
                {subTree.map(({ sub, subDirectItems, ssTree, subBudgeted, subSpent }) => {
                  const subStatus  = computeStatus(subSpent, subBudgeted, settings.warningThreshold)
                  const subPct     = pct(subSpent, subBudgeted)
                  const subKey     = `sub-${sub.id}`
                  const subCollapsed = collapsed.has(subKey)
                  const subDirectItem = subDirectItems[0]
                  const subHasChildren = ssTree.length > 0

                  return (
                    <div key={sub.id}>
                      {/* Fila subcategoría */}
                      <div className="w-full flex items-center gap-2 pl-10 pr-4 py-3 bg-slate-50/60">
                        <button
                          onClick={() => toggleCollapse(subKey)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-700 flex-1">{sub.name}</span>
                              <span className={`text-xs font-bold ${STATUS_TEXT_COLORS[subStatus]}`}>
                                {formatCurrencyFull(subSpent, settings)}
                                <span className="text-slate-400 font-normal"> / {formatCurrencyFull(subBudgeted, settings)}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ProgressBar percentage={subPct} status={subStatus} thin className="flex-1" />
                              <span className={`text-[10px] font-bold ${STATUS_TEXT_COLORS[subStatus]}`}>{subPct}%</span>
                            </div>
                          </div>
                        </button>
                        {subDirectItem && (
                          <button onClick={() => setDeleting(subDirectItem)} className="text-slate-200 flex-shrink-0" title="Eliminar presupuesto de la subcategoría">
                            <Trash2 size={13} />
                          </button>
                        )}
                        {subHasChildren && (
                          <button onClick={() => toggleCollapse(subKey)} className="text-slate-300 flex-shrink-0">
                            {subCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>

                      {!subCollapsed && subHasChildren && (
                        <>
                          {/* Sub-subcategorías */}
                          {ssTree.map(({ ss, ssItems, ssBudgeted, ssSpent }) => (
                            <div key={ss.id}>
                              {ssItems.map(item => (
                                <div key={item.id} className="pl-16 pr-4 bg-slate-100/30">
                                  <ItemRow
                                    label={ss.name}
                                    budgeted={ssBudgeted}
                                    spent={ssSpent}
                                    item={item}
                                    threshold={settings.warningThreshold}
                                    settings={settings}
                                    onDelete={setDeleting}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar ítem?"
        message="Se eliminará este ítem del presupuesto."
        onConfirm={() => { deleting && deleteBudgetItem(deleting.id); setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
