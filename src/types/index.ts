// ─── Identity ────────────────────────────────────────────────────────────────
export type ID = string

// ─── Category Hierarchy ──────────────────────────────────────────────────────
export interface Category {
  id: ID
  name: string
  icon: string
  color: string
  order: number
  createdAt: string
}

export interface Subcategory {
  id: ID
  categoryId: ID
  name: string
  order: number
  createdAt: string
}

export interface SubSubcategory {
  id: ID
  subcategoryId: ID
  name: string
  order: number
  createdAt: string
}

export type CategoryLevel = 'category' | 'subcategory' | 'sub_subcategory'

export interface CategoryRef {
  level: CategoryLevel
  categoryId: ID
  subcategoryId?: ID
  subSubcategoryId?: ID
}

// ─── Cuentas ─────────────────────────────────────────────────────────────────
export type AccountType = 'cash' | 'bank' | 'savings' | 'credit' | 'investment' | 'other'

export interface Account {
  id: ID
  name: string
  icon: string
  color: string
  type: AccountType
  initialBalance: number     // saldo inicial en moneda oficial
  initialBalanceAlt: number  // saldo inicial en moneda alterna
  order: number
  createdAt: string
}

// ─── Presupuesto ─────────────────────────────────────────────────────────────
export interface BudgetPeriod {
  id: ID
  month: number
  year: number
  name: string
  isActive: boolean
  createdAt: string
}

export interface BudgetItem {
  id: ID
  budgetPeriodId: ID
  categoryRef: CategoryRef
  amount: number
  notes?: string
}

// ─── Transacciones (gastos e ingresos) ───────────────────────────────────────
export type TransactionType = 'expense' | 'income'

export interface Transaction {
  id: ID
  type: TransactionType
  accountId: ID
  budgetPeriodId: ID
  categoryRef?: CategoryRef  // opcional para ingresos
  amount: number             // moneda oficial
  amountAlt: number          // moneda alterna al momento del registro
  date: string               // YYYY-MM-DD
  description: string
  notes?: string
  imageId?: ID
  createdAt: string
  updatedAt: string
}

// ─── Configuración ───────────────────────────────────────────────────────────
export interface AppSettings {
  // Moneda oficial
  currencySymbol: string   // "$"
  currencyCode: string     // "ARS"
  currencyName: string     // "Peso Argentino"
  // Moneda alterna
  altCurrencySymbol: string  // "U$S"
  altCurrencyCode: string    // "USD"
  altCurrencyName: string    // "Dólar"
  // Factor: cuántas unidades de moneda oficial = 1 unidad de moneda alterna
  conversionFactor: number   // ej: 1000 → $1.000 = U$S 1
  // General
  locale: string
  warningThreshold: number
}

// ─── Derivados del dashboard (no persistidos) ─────────────────────────────────
export type BudgetStatus = 'ok' | 'warning' | 'over' | 'unbudgeted'

export interface SubSubcategoryRollup {
  subSubcategory: SubSubcategory
  budgeted: number
  spent: number
  percentage: number
  status: BudgetStatus
}

export interface SubcategoryRollup {
  subcategory: Subcategory
  budgeted: number
  spent: number
  percentage: number
  status: BudgetStatus
  subSubcategories: SubSubcategoryRollup[]
}

export interface CategoryRollup {
  category: Category
  budgeted: number
  spent: number
  percentage: number
  status: BudgetStatus
  subcategories: SubcategoryRollup[]
}

export interface DashboardSummary {
  totalBudgeted: number
  totalSpent: number
  totalPercentage: number
  totalStatus: BudgetStatus
  rollups: CategoryRollup[]
}

// ─── Saldo de cuenta (derivado) ───────────────────────────────────────────────
export interface AccountBalance {
  account: Account
  balance: number     // saldo en moneda oficial
  balanceAlt: number  // saldo en moneda alterna
}

// ─── Lista de compras ─────────────────────────────────────────────────────────
export interface ShoppingList {
  id: ID
  name: string
  createdAt: string
}

export interface ShoppingListItem {
  id: ID
  listId: ID
  name: string
  categoryRef?: CategoryRef
  estimatedAmount: number     // monto estimado en moneda oficial
  estimatedAmountAlt: number  // monto estimado en moneda alterna
  actualAmount?: number       // monto real pagado (guardado al ejecutar)
  actualAmountAlt?: number
  notes?: string
  checked: boolean
  transactionId?: ID          // FK al transaction creado al ejecutar
  createdAt: string
}
