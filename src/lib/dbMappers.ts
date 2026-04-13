import type {
  Category, Subcategory, SubSubcategory, Account,
  BudgetPeriod, BudgetItem, Transaction, ShoppingList, ShoppingListItem,
  AppSettings, CategoryRef, CategoryLevel,
} from '../types'

// ─── CategoryRef ─────────────────────────────────────────────────────────────
export function categoryRefToDb(ref: CategoryRef | undefined) {
  if (!ref) return { category_ref_level: null, category_id: null, subcategory_id: null, sub_subcategory_id: null }
  return {
    category_ref_level: ref.level,
    category_id:        ref.categoryId,
    subcategory_id:     ref.subcategoryId     ?? null,
    sub_subcategory_id: ref.subSubcategoryId  ?? null,
  }
}

export function categoryRefFromDb(row: {
  category_ref_level?: string | null
  category_id?:        string | null
  subcategory_id?:     string | null
  sub_subcategory_id?: string | null
}): CategoryRef | undefined {
  if (!row.category_ref_level || !row.category_id) return undefined
  return {
    level:              row.category_ref_level as CategoryLevel,
    categoryId:         row.category_id,
    subcategoryId:      row.subcategory_id     ?? undefined,
    subSubcategoryId:   row.sub_subcategory_id ?? undefined,
  }
}

// ─── Domain mappers ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const categoryFromDb    = (r: any): Category    => ({ id: r.id, name: r.name, icon: r.icon, color: r.color, order: r.order, createdAt: r.created_at })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const subcategoryFromDb = (r: any): Subcategory => ({ id: r.id, categoryId: r.category_id, name: r.name, order: r.order, createdAt: r.created_at })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const subSubFromDb      = (r: any): SubSubcategory => ({ id: r.id, subcategoryId: r.subcategory_id, name: r.name, order: r.order, createdAt: r.created_at })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const accountFromDb = (r: any): Account => ({
  id: r.id, name: r.name, icon: r.icon, color: r.color, type: r.type,
  initialBalance: Number(r.initial_balance), initialBalanceAlt: Number(r.initial_balance_alt),
  order: r.order, createdAt: r.created_at,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const budgetPeriodFromDb = (r: any): BudgetPeriod => ({
  id: r.id, month: r.month, year: r.year, name: r.name, isActive: r.is_active, createdAt: r.created_at,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const budgetItemFromDb = (r: any): BudgetItem => ({
  id: r.id, budgetPeriodId: r.budget_period_id,
  categoryRef: categoryRefFromDb(r)!,
  amount: Number(r.amount), notes: r.notes ?? undefined,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const transactionFromDb = (r: any): Transaction => ({
  id: r.id, type: r.type,
  accountId: r.account_id ?? '',
  budgetPeriodId: r.budget_period_id,
  categoryRef: categoryRefFromDb(r),
  amount: Number(r.amount), amountAlt: Number(r.amount_alt),
  date: r.date, description: r.description, notes: r.notes ?? undefined,
  imageId: r.image_path ?? undefined,
  createdAt: r.created_at, updatedAt: r.updated_at,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const shoppingListFromDb = (r: any): ShoppingList => ({ id: r.id, name: r.name, createdAt: r.created_at })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const shoppingListItemFromDb = (r: any): ShoppingListItem => ({
  id: r.id, listId: r.list_id, name: r.name,
  categoryRef: categoryRefFromDb(r),
  estimatedAmount: Number(r.estimated_amount), estimatedAmountAlt: Number(r.estimated_amount_alt),
  actualAmount:    r.actual_amount    != null ? Number(r.actual_amount)     : undefined,
  actualAmountAlt: r.actual_amount_alt != null ? Number(r.actual_amount_alt) : undefined,
  notes: r.notes ?? undefined, checked: r.checked,
  transactionId: r.transaction_id ?? undefined, createdAt: r.created_at,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const settingsFromDb = (r: any): AppSettings => ({
  currencySymbol: r.currency_symbol, currencyCode: r.currency_code, currencyName: r.currency_name,
  altCurrencySymbol: r.alt_currency_symbol, altCurrencyCode: r.alt_currency_code, altCurrencyName: r.alt_currency_name,
  conversionFactor: Number(r.conversion_factor), locale: r.locale, warningThreshold: Number(r.warning_threshold),
})
