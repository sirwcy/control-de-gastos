import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type {
  Category, Subcategory, SubSubcategory,
  Account,
  BudgetPeriod, BudgetItem,
  Transaction, CategoryRef,
  AppSettings, ID, AccountBalance,
  ShoppingList, ShoppingListItem,
} from '../types'
import { SCHEMA_VERSION } from '../lib/constants'
import { periodName, todayISO } from '../lib/formatters'
import { migrate } from './migrations'
import { deleteImage } from '../lib/imageStore'

const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$',
  currencyCode: 'ARS',
  currencyName: 'Peso Argentino',
  altCurrencySymbol: 'U$S',
  altCurrencyCode: 'USD',
  altCurrencyName: 'Dólar',
  conversionFactor: 1,
  locale: 'es-AR',
  warningThreshold: 0.80,
}

interface DataState {
  schemaVersion: number
  categories: Category[]
  subcategories: Subcategory[]
  subSubcategories: SubSubcategory[]
  accounts: Account[]
  budgetPeriods: BudgetPeriod[]
  budgetItems: BudgetItem[]
  transactions: Transaction[]
  settings: AppSettings

  // Categorías
  addCategory: (data: Pick<Category, 'name' | 'icon' | 'color'>) => Category
  updateCategory: (id: ID, data: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'order'>>) => void
  deleteCategory: (id: ID) => void

  // Subcategorías
  addSubcategory: (categoryId: ID, name: string) => Subcategory
  updateSubcategory: (id: ID, data: Partial<Pick<Subcategory, 'name' | 'order'>>) => void
  deleteSubcategory: (id: ID) => void

  // Sub-subcategorías
  addSubSubcategory: (subcategoryId: ID, name: string) => SubSubcategory
  updateSubSubcategory: (id: ID, data: Partial<Pick<SubSubcategory, 'name' | 'order'>>) => void
  deleteSubSubcategory: (id: ID) => void

  // Cuentas
  addAccount: (data: Pick<Account, 'name' | 'icon' | 'color' | 'type' | 'initialBalance' | 'initialBalanceAlt'>) => Account
  updateAccount: (id: ID, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => void
  deleteAccount: (id: ID) => void
  getAccountBalance: (accountId: ID) => AccountBalance | undefined

  // Períodos de presupuesto
  addBudgetPeriod: (month: number, year: number) => BudgetPeriod
  setActivePeriod: (id: ID) => void
  getActivePeriod: () => BudgetPeriod | undefined
  ensureCurrentPeriod: () => BudgetPeriod

  // Ítems de presupuesto
  upsertBudgetItem: (periodId: ID, categoryRef: CategoryRef, amount: number, notes?: string) => void
  deleteBudgetItem: (id: ID) => void

  // Transacciones
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction
  updateTransaction: (id: ID, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => void
  deleteTransaction: (id: ID) => void

  // Lista de compras
  shoppingLists: ShoppingList[]
  shoppingListItems: ShoppingListItem[]
  addShoppingList: (name: string) => ShoppingList
  updateShoppingList: (id: ID, name: string) => void
  deleteShoppingList: (id: ID) => void
  addShoppingListItem: (data: Omit<ShoppingListItem, 'id' | 'checked' | 'transactionId' | 'createdAt'>) => ShoppingListItem
  updateShoppingListItem: (id: ID, data: Partial<Omit<ShoppingListItem, 'id' | 'listId' | 'createdAt'>>) => void
  deleteShoppingListItem: (id: ID) => void
  checkShoppingListItem: (id: ID, amount: number, amountAlt: number, accountId: ID) => void
  uncheckShoppingListItem: (id: ID) => void

  // Settings
  updateSettings: (data: Partial<AppSettings>) => void
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      categories: [],
      subcategories: [],
      subSubcategories: [],
      accounts: [],
      budgetPeriods: [],
      budgetItems: [],
      transactions: [],
      settings: DEFAULT_SETTINGS,
      shoppingLists: [],
      shoppingListItems: [],

      // ─── Categorías ─────────────────────────────────────────────────────────
      addCategory: (data) => {
        const cat: Category = {
          id: uuid(), name: data.name, icon: data.icon, color: data.color,
          order: get().categories.length, createdAt: new Date().toISOString(),
        }
        set(s => ({ categories: [...s.categories, cat] }))
        return cat
      },
      updateCategory: (id, data) => {
        set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...data } : c) }))
      },
      deleteCategory: (id) => {
        const subIdSet = new Set(get().subcategories.filter(s => s.categoryId === id).map(s => s.id))
        const subSubIdSet = new Set(get().subSubcategories.filter(ss => subIdSet.has(ss.subcategoryId)).map(ss => ss.id))
        set(s => ({
          categories: s.categories.filter(c => c.id !== id),
          subcategories: s.subcategories.filter(sub => sub.categoryId !== id),
          subSubcategories: s.subSubcategories.filter(ss => !subIdSet.has(ss.subcategoryId)),
          budgetItems: s.budgetItems.filter(b =>
            b.categoryRef.categoryId !== id &&
            !subIdSet.has(b.categoryRef.subcategoryId ?? '') &&
            !subSubIdSet.has(b.categoryRef.subSubcategoryId ?? '')
          ),
          transactions: s.transactions.map(t =>
            t.categoryRef && (
              t.categoryRef.categoryId === id ||
              subIdSet.has(t.categoryRef.subcategoryId ?? '') ||
              subSubIdSet.has(t.categoryRef.subSubcategoryId ?? '')
            ) ? { ...t, categoryRef: undefined } : t
          ),
        }))
      },

      // ─── Subcategorías ───────────────────────────────────────────────────────
      addSubcategory: (categoryId, name) => {
        const sub: Subcategory = {
          id: uuid(), categoryId, name,
          order: get().subcategories.filter(s => s.categoryId === categoryId).length,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ subcategories: [...s.subcategories, sub] }))
        return sub
      },
      updateSubcategory: (id, data) => {
        set(s => ({ subcategories: s.subcategories.map(sub => sub.id === id ? { ...sub, ...data } : sub) }))
      },
      deleteSubcategory: (id) => {
        const subSubIdSet = new Set(get().subSubcategories.filter(ss => ss.subcategoryId === id).map(ss => ss.id))
        set(s => ({
          subcategories: s.subcategories.filter(sub => sub.id !== id),
          subSubcategories: s.subSubcategories.filter(ss => ss.subcategoryId !== id),
          budgetItems: s.budgetItems.filter(b =>
            b.categoryRef.subcategoryId !== id && !subSubIdSet.has(b.categoryRef.subSubcategoryId ?? '')
          ),
          transactions: s.transactions.map(t =>
            t.categoryRef?.subcategoryId === id || subSubIdSet.has(t.categoryRef?.subSubcategoryId ?? '')
              ? { ...t, categoryRef: undefined } : t
          ),
        }))
      },

      // ─── Sub-subcategorías ───────────────────────────────────────────────────
      addSubSubcategory: (subcategoryId, name) => {
        const ss: SubSubcategory = {
          id: uuid(), subcategoryId, name,
          order: get().subSubcategories.filter(ss => ss.subcategoryId === subcategoryId).length,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ subSubcategories: [...s.subSubcategories, ss] }))
        return ss
      },
      updateSubSubcategory: (id, data) => {
        set(s => ({ subSubcategories: s.subSubcategories.map(ss => ss.id === id ? { ...ss, ...data } : ss) }))
      },
      deleteSubSubcategory: (id) => {
        set(s => ({
          subSubcategories: s.subSubcategories.filter(ss => ss.id !== id),
          budgetItems: s.budgetItems.filter(b => b.categoryRef.subSubcategoryId !== id),
          transactions: s.transactions.map(t =>
            t.categoryRef?.subSubcategoryId === id ? { ...t, categoryRef: undefined } : t
          ),
        }))
      },

      // ─── Cuentas ─────────────────────────────────────────────────────────────
      addAccount: (data) => {
        const account: Account = {
          id: uuid(), ...data,
          order: get().accounts.length,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ accounts: [...s.accounts, account] }))
        return account
      },
      updateAccount: (id, data) => {
        set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a) }))
      },
      deleteAccount: (id) => {
        set(s => ({
          accounts: s.accounts.filter(a => a.id !== id),
          // Desvincula las transacciones (no las borra)
          transactions: s.transactions.map(t => t.accountId === id ? { ...t, accountId: '' } : t),
        }))
      },
      getAccountBalance: (accountId) => {
        const account = get().accounts.find(a => a.id === accountId)
        if (!account) return undefined
        const txs = get().transactions.filter(t => t.accountId === accountId)
        const balance = account.initialBalance + txs.reduce((sum, t) =>
          t.type === 'income' ? sum + t.amount : sum - t.amount, 0
        )
        const balanceAlt = account.initialBalanceAlt + txs.reduce((sum, t) =>
          t.type === 'income' ? sum + t.amountAlt : sum - t.amountAlt, 0
        )
        return { account, balance, balanceAlt }
      },

      // ─── Períodos ────────────────────────────────────────────────────────────
      addBudgetPeriod: (month, year) => {
        const period: BudgetPeriod = {
          id: uuid(), month, year, name: periodName(month, year),
          isActive: true, createdAt: new Date().toISOString(),
        }
        set(s => ({ budgetPeriods: [...s.budgetPeriods.map(p => ({ ...p, isActive: false })), period] }))
        return period
      },
      setActivePeriod: (id) => {
        set(s => ({ budgetPeriods: s.budgetPeriods.map(p => ({ ...p, isActive: p.id === id })) }))
      },
      getActivePeriod: () => get().budgetPeriods.find(p => p.isActive),
      ensureCurrentPeriod: () => {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()
        const existing = get().budgetPeriods.find(p => p.month === month && p.year === year)
        if (existing) {
          if (!existing.isActive) get().setActivePeriod(existing.id)
          return existing
        }
        return get().addBudgetPeriod(month, year)
      },

      // ─── Presupuesto ─────────────────────────────────────────────────────────
      upsertBudgetItem: (periodId, categoryRef, amount, notes) => {
        const refKey = (r: CategoryRef) =>
          `${r.categoryId}|${r.subcategoryId ?? ''}|${r.subSubcategoryId ?? ''}`
        const key = refKey(categoryRef)
        const existing = get().budgetItems.find(
          b => b.budgetPeriodId === periodId && refKey(b.categoryRef) === key
        )
        if (existing) {
          set(s => ({ budgetItems: s.budgetItems.map(b => b.id === existing.id ? { ...b, amount, notes } : b) }))
        } else {
          set(s => ({ budgetItems: [...s.budgetItems, { id: uuid(), budgetPeriodId: periodId, categoryRef, amount, notes }] }))
        }
      },
      deleteBudgetItem: (id) => {
        set(s => ({ budgetItems: s.budgetItems.filter(b => b.id !== id) }))
      },

      // ─── Transacciones ───────────────────────────────────────────────────────
      addTransaction: (data) => {
        const now = new Date().toISOString()
        const tx: Transaction = { id: uuid(), ...data, createdAt: now, updatedAt: now }
        set(s => ({ transactions: [...s.transactions, tx] }))
        return tx
      },
      updateTransaction: (id, data) => {
        set(s => ({
          transactions: s.transactions.map(t =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        }))
      },
      deleteTransaction: (id) => {
        const tx = get().transactions.find(t => t.id === id)
        if (tx?.imageId) deleteImage(tx.imageId)
        set(s => ({ transactions: s.transactions.filter(t => t.id !== id) }))
      },

      // ─── Lista de compras ────────────────────────────────────────────────────
      addShoppingList: (name) => {
        const list: ShoppingList = { id: uuid(), name, createdAt: new Date().toISOString() }
        set(s => ({ shoppingLists: [...s.shoppingLists, list] }))
        return list
      },
      updateShoppingList: (id, name) => {
        set(s => ({ shoppingLists: s.shoppingLists.map(l => l.id === id ? { ...l, name } : l) }))
      },
      deleteShoppingList: (id) => {
        // Cascade: eliminar ítems y sus transacciones asociadas
        const items = get().shoppingListItems.filter(i => i.listId === id)
        const txIds = new Set(items.map(i => i.transactionId).filter(Boolean) as string[])
        get().transactions
          .filter(t => txIds.has(t.id) && t.imageId)
          .forEach(t => deleteImage(t.imageId!))
        set(s => ({
          shoppingLists: s.shoppingLists.filter(l => l.id !== id),
          shoppingListItems: s.shoppingListItems.filter(i => i.listId !== id),
          transactions: s.transactions.filter(t => !txIds.has(t.id)),
        }))
      },
      addShoppingListItem: (data) => {
        const item: ShoppingListItem = { id: uuid(), ...data, checked: false, createdAt: new Date().toISOString() }
        set(s => ({ shoppingListItems: [...s.shoppingListItems, item] }))
        return item
      },
      updateShoppingListItem: (id, data) => {
        set(s => ({ shoppingListItems: s.shoppingListItems.map(i => i.id === id ? { ...i, ...data } : i) }))
      },
      deleteShoppingListItem: (id) => {
        const item = get().shoppingListItems.find(i => i.id === id)
        if (item?.transactionId) {
          const tx = get().transactions.find(t => t.id === item.transactionId)
          if (tx?.imageId) deleteImage(tx.imageId)
        }
        set(s => ({
          shoppingListItems: s.shoppingListItems.filter(i => i.id !== id),
          transactions: item?.transactionId
            ? s.transactions.filter(t => t.id !== item.transactionId)
            : s.transactions,
        }))
      },
      checkShoppingListItem: (id, amount, amountAlt, accountId) => {
        const item = get().shoppingListItems.find(i => i.id === id)
        if (!item || item.checked) return
        const activePeriod = get().budgetPeriods.find(p => p.isActive)
        if (!activePeriod) return
        const tx = get().addTransaction({
          type: 'expense',
          accountId,
          budgetPeriodId: activePeriod.id,
          categoryRef: item.categoryRef,
          amount,
          amountAlt,
          date: todayISO(),
          description: item.name,
          notes: item.notes,
        })
        set(s => ({
          shoppingListItems: s.shoppingListItems.map(i =>
            i.id === id ? { ...i, checked: true, transactionId: tx.id, actualAmount: amount, actualAmountAlt: amountAlt } : i
          ),
        }))
      },
      uncheckShoppingListItem: (id) => {
        const item = get().shoppingListItems.find(i => i.id === id)
        if (!item?.checked) return
        if (item.transactionId) {
          const tx = get().transactions.find(t => t.id === item.transactionId)
          if (tx?.imageId) deleteImage(tx.imageId)
        }
        set(s => ({
          shoppingListItems: s.shoppingListItems.map(i =>
            i.id === id ? { ...i, checked: false, transactionId: undefined, actualAmount: undefined, actualAmountAlt: undefined } : i
          ),
          transactions: item.transactionId
            ? s.transactions.filter(t => t.id !== item.transactionId)
            : s.transactions,
        }))
      },

      updateSettings: (data) => {
        set(s => ({ settings: { ...s.settings, ...data } }))
      },
    }),
    {
      name: 'control-gastos-v1',
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
      migrate,
    }
  )
)
