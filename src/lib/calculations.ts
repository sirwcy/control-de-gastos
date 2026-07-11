import type {
  Category, Subcategory, SubSubcategory,
  BudgetItem, Transaction,
  CategoryRollup, SubcategoryRollup, SubSubcategoryRollup,
  DashboardSummary, BudgetStatus,
} from '../types'

function computeStatus(spent: number, budgeted: number, threshold: number): BudgetStatus {
  if (budgeted === 0) return spent > 0 ? 'unbudgeted' : 'ok'
  const pct = spent / budgeted
  if (pct > 1.0) return 'over'
  if (pct >= threshold) return 'warning'
  return 'ok'
}

function pct(spent: number, budgeted: number): number {
  if (budgeted === 0) return spent > 0 ? 100 : 0
  return Math.round((spent / budgeted) * 100)
}

export function computeDashboard(params: {
  categories: Category[]
  subcategories: Subcategory[]
  subSubcategories: SubSubcategory[]
  budgetItems: BudgetItem[]
  transactions: Transaction[]
  periodId: string
  warningThreshold: number
}): DashboardSummary {
  const { categories, subcategories, subSubcategories, budgetItems, transactions, periodId, warningThreshold } = params

  // Una sola pasada — solo gastos (expenses) afectan el presupuesto
  const expByCat    = new Map<string, number>()
  const expBySub    = new Map<string, number>()
  const expBySubSub = new Map<string, number>()
  for (const t of transactions) {
    if (t.budgetPeriodId !== periodId || t.type !== 'expense' || !t.categoryRef) continue
    const { level, categoryId, subcategoryId, subSubcategoryId } = t.categoryRef
    if (level === 'category')
      expByCat.set(categoryId, (expByCat.get(categoryId) ?? 0) + t.amount)
    else if (level === 'subcategory')
      expBySub.set(subcategoryId!, (expBySub.get(subcategoryId!) ?? 0) + t.amount)
    else
      expBySubSub.set(subSubcategoryId!, (expBySubSub.get(subSubcategoryId!) ?? 0) + t.amount)
  }

  const budByCat    = new Map<string, number>()
  const budBySub    = new Map<string, number>()
  const budBySubSub = new Map<string, number>()
  for (const b of budgetItems) {
    if (b.budgetPeriodId !== periodId) continue
    const { level, categoryId, subcategoryId, subSubcategoryId } = b.categoryRef
    if (level === 'category')
      budByCat.set(categoryId, (budByCat.get(categoryId) ?? 0) + b.amount)
    else if (level === 'subcategory')
      budBySub.set(subcategoryId!, (budBySub.get(subcategoryId!) ?? 0) + b.amount)
    else
      budBySubSub.set(subSubcategoryId!, (budBySubSub.get(subSubcategoryId!) ?? 0) + b.amount)
  }

  const rollups: CategoryRollup[] = categories.map(cat => {
    const catSubs = subcategories.filter(s => s.categoryId === cat.id).sort((a, b) => a.order - b.order)

    const subcatRollups: SubcategoryRollup[] = catSubs.map(sub => {
      const subSubs = subSubcategories.filter(ss => ss.subcategoryId === sub.id).sort((a, b) => a.order - b.order)

      const subSubRollups: SubSubcategoryRollup[] = subSubs.map(ss => {
        const spent    = expBySubSub.get(ss.id) ?? 0
        const budgeted = budBySubSub.get(ss.id) ?? 0
        return { subSubcategory: ss, budgeted, spent, percentage: pct(spent, budgeted), status: computeStatus(spent, budgeted, warningThreshold) }
      })

      const spent    = (expBySub.get(sub.id) ?? 0) + subSubRollups.reduce((s, r) => s + r.spent, 0)
      const budgeted = (budBySub.get(sub.id) ?? 0) + subSubRollups.reduce((s, r) => s + r.budgeted, 0)
      // Solo mostrar sub-subcategorías con gasto o presupuesto (el resto no aporta al total)
      return {
        subcategory: sub, budgeted, spent,
        percentage: pct(spent, budgeted), status: computeStatus(spent, budgeted, warningThreshold),
        subSubcategories: subSubRollups.filter(r => r.budgeted > 0 || r.spent > 0),
      }
    })

    const spent    = (expByCat.get(cat.id) ?? 0) + subcatRollups.reduce((s, r) => s + r.spent, 0)
    const budgeted = (budByCat.get(cat.id) ?? 0) + subcatRollups.reduce((s, r) => s + r.budgeted, 0)
    // Solo mostrar subcategorías con gasto o presupuesto
    return {
      category: cat, budgeted, spent,
      percentage: pct(spent, budgeted), status: computeStatus(spent, budgeted, warningThreshold),
      subcategories: subcatRollups.filter(r => r.budgeted > 0 || r.spent > 0),
    }
  })

  const activeRollups = rollups.filter(r => r.budgeted > 0 || r.spent > 0)
  const totalBudgeted = activeRollups.reduce((s, r) => s + r.budgeted, 0)
  const totalSpent    = activeRollups.reduce((s, r) => s + r.spent, 0)

  return {
    totalBudgeted, totalSpent,
    totalPercentage: pct(totalSpent, totalBudgeted),
    totalStatus: computeStatus(totalSpent, totalBudgeted, warningThreshold),
    rollups: activeRollups,
  }
}
