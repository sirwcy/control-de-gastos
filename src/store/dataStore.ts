import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  Category, Subcategory, SubSubcategory,
  Account, AccountBalance, Currency, CurrencyRate,
  BudgetPeriod, BudgetItem,
  Transaction, CategoryRef,
  AppSettings, ID,
  ShoppingList, ShoppingListItem,
} from '../types'
import { periodName, todayISO } from '../lib/formatters'
import { deleteImage } from '../lib/imageStore'
import { supabase } from '../lib/supabase'
import {
  categoryFromDb, subcategoryFromDb, subSubFromDb, accountFromDb, currencyFromDb, currencyRateFromDb,
  budgetPeriodFromDb, budgetItemFromDb, transactionFromDb,
  shoppingListFromDb, shoppingListItemFromDb, settingsFromDb,
  categoryRefToDb,
} from '../lib/dbMappers'

const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$', currencyCode: 'ARS', currencyName: 'Peso Argentino',
  locale: 'es-AR', warningThreshold: 0.80,
}

// Perfil resumido de un miembro de la cartera (para atribuir autoría)
export interface MemberProfile {
  userId: string
  displayName: string
  username: string | null
}

interface DataState {
  walletId: string | null
  loading: boolean
  schemaVersion: number
  categories: Category[]
  subcategories: Subcategory[]
  subSubcategories: SubSubcategory[]
  accounts: Account[]
  currencies: Currency[]
  currencyRates: CurrencyRate[]
  budgetPeriods: BudgetPeriod[]
  budgetItems: BudgetItem[]
  transactions: Transaction[]
  settings: AppSettings
  shoppingLists: ShoppingList[]
  shoppingListItems: ShoppingListItem[]
  members: MemberProfile[]
  getMemberName: (userId: ID | undefined) => string | undefined

  // Lifecycle
  loadWalletData: (walletId: string) => Promise<void>
  clearWalletData: () => void

  // Categorías
  addCategory:       (data: Pick<Category, 'name' | 'icon' | 'color'>) => Promise<Category>
  updateCategory:    (id: ID, data: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'order'>>) => Promise<void>
  deleteCategory:    (id: ID) => Promise<void>

  // Subcategorías
  addSubcategory:    (categoryId: ID, name: string) => Promise<Subcategory>
  updateSubcategory: (id: ID, data: Partial<Pick<Subcategory, 'name' | 'order'>>) => Promise<void>
  deleteSubcategory: (id: ID) => Promise<void>

  // Sub-subcategorías
  addSubSubcategory:    (subcategoryId: ID, name: string) => Promise<SubSubcategory>
  updateSubSubcategory: (id: ID, data: Partial<Pick<SubSubcategory, 'name' | 'order'>>) => Promise<void>
  deleteSubSubcategory: (id: ID) => Promise<void>

  // Cuentas
  addAccount:        (data: Pick<Account, 'name' | 'icon' | 'color' | 'type' | 'initialBalance' | 'initialBalanceAlt' | 'currencyId' | 'displayCurrencyIds' | 'showPrimary'>) => Promise<Account>
  updateAccount:     (id: ID, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => Promise<void>
  deleteAccount:     (id: ID) => Promise<void>
  getAccountBalance: (accountId: ID) => AccountBalance | undefined

  // Monedas (catálogo de secundarias)
  addCurrency:       (data: Pick<Currency, 'code' | 'symbol' | 'name' | 'factor'> & Partial<Pick<Currency, 'sourceUrl'>>) => Promise<Currency>
  updateCurrency:    (id: ID, data: Partial<Pick<Currency, 'code' | 'symbol' | 'name' | 'factor' | 'sourceUrl' | 'order'>>) => Promise<void>
  deleteCurrency:    (id: ID) => Promise<{ error: string | null }>
  getCurrency:       (id: ID | undefined) => Currency | undefined
  getRatesForCurrency: (id: ID) => CurrencyRate[]
  refreshBcvRates:   () => Promise<{ error: string | null; rate?: number }>

  // Períodos
  addBudgetPeriod:   (month: number, year: number) => Promise<BudgetPeriod>
  setActivePeriod:   (id: ID) => Promise<void>
  getActivePeriod:   () => BudgetPeriod | undefined
  ensureCurrentPeriod: () => Promise<BudgetPeriod>

  // Ítems de presupuesto
  upsertBudgetItem:  (periodId: ID, categoryRef: CategoryRef, amount: number, notes?: string) => Promise<void>
  deleteBudgetItem:  (id: ID) => Promise<void>

  // Transacciones
  addTransaction:    (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>
  updateTransaction: (id: ID, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteTransaction: (id: ID) => Promise<void>

  // Lista de compras
  addShoppingList:       (name: string) => Promise<ShoppingList>
  updateShoppingList:    (id: ID, name: string) => Promise<void>
  deleteShoppingList:    (id: ID) => Promise<void>
  addShoppingListItem:   (data: Omit<ShoppingListItem, 'id' | 'checked' | 'transactionId' | 'createdAt'>) => Promise<ShoppingListItem>
  updateShoppingListItem:(id: ID, data: Partial<Omit<ShoppingListItem, 'id' | 'listId' | 'createdAt'>>) => Promise<void>
  deleteShoppingListItem:(id: ID) => Promise<void>
  checkShoppingListItem: (id: ID, amount: number, amountAlt: number, accountId: ID) => Promise<void>
  uncheckShoppingListItem:(id: ID) => Promise<void>

  // Settings
  updateSettings: (data: Partial<AppSettings>) => Promise<void>
}

function wid() { return useDataStore.getState().walletId! }

export const useDataStore = create<DataState>()((set, get) => ({
  walletId:        null,
  loading:         false,
  schemaVersion:   2,
  categories:      [],
  subcategories:   [],
  subSubcategories:[],
  accounts:        [],
  currencies:      [],
  currencyRates:   [],
  budgetPeriods:   [],
  budgetItems:     [],
  transactions:    [],
  settings:        DEFAULT_SETTINGS,
  shoppingLists:   [],
  shoppingListItems:[],
  members:         [],

  getMemberName: (userId) =>
    userId ? get().members.find(m => m.userId === userId)?.displayName : undefined,

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  loadWalletData: async (walletId) => {
    set({ walletId, loading: true })
    const W = walletId

    const [cats, subs, subsubs, accs, currs, rates, periods, items, txs, lists, listItems, settRow, mems] = await Promise.all([
      supabase.from('cdg_categories').select('*').eq('wallet_id', W).order('order'),
      supabase.from('cdg_subcategories').select('*').eq('wallet_id', W).order('order'),
      supabase.from('cdg_sub_subcategories').select('*').eq('wallet_id', W).order('order'),
      supabase.from('cdg_accounts').select('*').eq('wallet_id', W).order('order'),
      supabase.from('cdg_currencies').select('*').eq('wallet_id', W).order('order'),
      supabase.from('cdg_currency_rates').select('*').eq('wallet_id', W).order('rate_date', { ascending: false }),
      supabase.from('cdg_budget_periods').select('*').eq('wallet_id', W).order('created_at'),
      supabase.from('cdg_budget_items').select('*').eq('wallet_id', W),
      supabase.from('cdg_transactions').select('*').eq('wallet_id', W).order('date', { ascending: false }),
      supabase.from('cdg_shopping_lists').select('*').eq('wallet_id', W).order('created_at'),
      supabase.from('cdg_shopping_list_items').select('*').eq('wallet_id', W).order('created_at'),
      supabase.from('cdg_wallet_settings').select('*').eq('wallet_id', W).single(),
      supabase.from('cdg_wallet_members').select('user_id').eq('wallet_id', W),
    ])

    // Perfiles de los miembros (para mostrar el autor de cada movimiento).
    // No hay FK members→profiles, así que se traen aparte.
    const memberIds = (mems.data ?? []).map(m => m.user_id)
    let members: MemberProfile[] = []
    if (memberIds.length > 0) {
      const { data: profs } = await supabase
        .from('cdg_profiles')
        .select('id, display_name, username')
        .in('id', memberIds)
      members = (profs ?? []).map(p => ({ userId: p.id, displayName: p.display_name, username: p.username }))
    }

    set({
      categories:       (cats.data      ?? []).map(categoryFromDb),
      subcategories:    (subs.data      ?? []).map(subcategoryFromDb),
      subSubcategories: (subsubs.data   ?? []).map(subSubFromDb),
      accounts:         (accs.data      ?? []).map(accountFromDb),
      currencies:       (currs.data     ?? []).map(currencyFromDb),
      currencyRates:    (rates.data     ?? []).map(currencyRateFromDb),
      budgetPeriods:    (periods.data   ?? []).map(budgetPeriodFromDb),
      budgetItems:      (items.data     ?? []).map(budgetItemFromDb),
      transactions:     (txs.data       ?? []).map(transactionFromDb),
      shoppingLists:    (lists.data     ?? []).map(shoppingListFromDb),
      shoppingListItems:(listItems.data ?? []).map(shoppingListItemFromDb),
      settings:         settRow.data ? settingsFromDb(settRow.data) : DEFAULT_SETTINGS,
      members,
      loading: false,
    })
  },

  clearWalletData: () => set({
    walletId: null, loading: false,
    categories: [], subcategories: [], subSubcategories: [], accounts: [], currencies: [], currencyRates: [],
    budgetPeriods: [], budgetItems: [], transactions: [], settings: DEFAULT_SETTINGS,
    shoppingLists: [], shoppingListItems: [], members: [],
  }),

  // ─── Categorías ─────────────────────────────────────────────────────────────
  addCategory: async (data) => {
    const id = uuid()
    const order = get().categories.length
    const { data: row, error } = await supabase
      .from('cdg_categories')
      .insert({ id, wallet_id: wid(), name: data.name, icon: data.icon, color: data.color, order })
      .select().single()
    if (error) throw error
    const cat = categoryFromDb(row)
    set(s => ({ categories: [...s.categories, cat] }))
    return cat
  },

  updateCategory: async (id, data) => {
    const { error } = await supabase.from('cdg_categories').update(data).eq('id', id)
    if (error) throw error
    set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...data } : c) }))
  },

  deleteCategory: async (id) => {
    // DB cascades: subcategories→sub_subcategories, budget_items; transactions SET NULL
    const { error } = await supabase.from('cdg_categories').delete().eq('id', id)
    if (error) throw error
    const subIds = new Set(get().subcategories.filter(s => s.categoryId === id).map(s => s.id))
    const subSubIds = new Set(get().subSubcategories.filter(ss => subIds.has(ss.subcategoryId)).map(ss => ss.id))
    set(s => ({
      categories:       s.categories.filter(c => c.id !== id),
      subcategories:    s.subcategories.filter(sub => sub.categoryId !== id),
      subSubcategories: s.subSubcategories.filter(ss => !subIds.has(ss.subcategoryId)),
      budgetItems:      s.budgetItems.filter(b =>
        b.categoryRef.categoryId !== id &&
        !subIds.has(b.categoryRef.subcategoryId ?? '') &&
        !subSubIds.has(b.categoryRef.subSubcategoryId ?? '')
      ),
      transactions: s.transactions.map(t =>
        t.categoryRef && (
          t.categoryRef.categoryId === id ||
          subIds.has(t.categoryRef.subcategoryId ?? '') ||
          subSubIds.has(t.categoryRef.subSubcategoryId ?? '')
        ) ? { ...t, categoryRef: undefined } : t
      ),
    }))
  },

  // ─── Subcategorías ──────────────────────────────────────────────────────────
  addSubcategory: async (categoryId, name) => {
    const id = uuid()
    const order = get().subcategories.filter(s => s.categoryId === categoryId).length
    const { data: row, error } = await supabase
      .from('cdg_subcategories')
      .insert({ id, wallet_id: wid(), category_id: categoryId, name, order })
      .select().single()
    if (error) throw error
    const sub = subcategoryFromDb(row)
    set(s => ({ subcategories: [...s.subcategories, sub] }))
    return sub
  },

  updateSubcategory: async (id, data) => {
    const { error } = await supabase.from('cdg_subcategories').update(data).eq('id', id)
    if (error) throw error
    set(s => ({ subcategories: s.subcategories.map(sub => sub.id === id ? { ...sub, ...data } : sub) }))
  },

  deleteSubcategory: async (id) => {
    const { error } = await supabase.from('cdg_subcategories').delete().eq('id', id)
    if (error) throw error
    const subSubIds = new Set(get().subSubcategories.filter(ss => ss.subcategoryId === id).map(ss => ss.id))
    set(s => ({
      subcategories:    s.subcategories.filter(sub => sub.id !== id),
      subSubcategories: s.subSubcategories.filter(ss => ss.subcategoryId !== id),
      budgetItems:      s.budgetItems.filter(b =>
        b.categoryRef.subcategoryId !== id && !subSubIds.has(b.categoryRef.subSubcategoryId ?? '')
      ),
      transactions: s.transactions.map(t =>
        t.categoryRef?.subcategoryId === id || subSubIds.has(t.categoryRef?.subSubcategoryId ?? '')
          ? { ...t, categoryRef: undefined } : t
      ),
    }))
  },

  // ─── Sub-subcategorías ───────────────────────────────────────────────────────
  addSubSubcategory: async (subcategoryId, name) => {
    const id = uuid()
    const order = get().subSubcategories.filter(ss => ss.subcategoryId === subcategoryId).length
    const { data: row, error } = await supabase
      .from('cdg_sub_subcategories')
      .insert({ id, wallet_id: wid(), subcategory_id: subcategoryId, name, order })
      .select().single()
    if (error) throw error
    const ss = subSubFromDb(row)
    set(s => ({ subSubcategories: [...s.subSubcategories, ss] }))
    return ss
  },

  updateSubSubcategory: async (id, data) => {
    const { error } = await supabase.from('cdg_sub_subcategories').update(data).eq('id', id)
    if (error) throw error
    set(s => ({ subSubcategories: s.subSubcategories.map(ss => ss.id === id ? { ...ss, ...data } : ss) }))
  },

  deleteSubSubcategory: async (id) => {
    const { error } = await supabase.from('cdg_sub_subcategories').delete().eq('id', id)
    if (error) throw error
    set(s => ({
      subSubcategories: s.subSubcategories.filter(ss => ss.id !== id),
      budgetItems:  s.budgetItems.filter(b => b.categoryRef.subSubcategoryId !== id),
      transactions: s.transactions.map(t =>
        t.categoryRef?.subSubcategoryId === id ? { ...t, categoryRef: undefined } : t
      ),
    }))
  },

  // ─── Cuentas ─────────────────────────────────────────────────────────────────
  addAccount: async (data) => {
    const id = uuid()
    const order = get().accounts.length
    const { data: row, error } = await supabase
      .from('cdg_accounts')
      .insert({
        id, wallet_id: wid(), name: data.name, icon: data.icon,
        color: data.color, type: data.type, order,
        initial_balance: data.initialBalance, initial_balance_alt: data.initialBalanceAlt,
        currency_id: data.currencyId ?? null,
        display_currency_ids: data.displayCurrencyIds ?? [],
        show_primary: data.showPrimary ?? false,
      })
      .select().single()
    if (error) throw error
    const account = accountFromDb(row)
    set(s => ({ accounts: [...s.accounts, account] }))
    return account
  },

  updateAccount: async (id, data) => {
    const dbData: Record<string, unknown> = {}
    if (data.name !== undefined)               dbData.name = data.name
    if (data.icon !== undefined)               dbData.icon = data.icon
    if (data.color !== undefined)              dbData.color = data.color
    if (data.type !== undefined)               dbData.type = data.type
    if (data.order !== undefined)              dbData.order = data.order
    if (data.initialBalance !== undefined)     dbData.initial_balance = data.initialBalance
    if (data.initialBalanceAlt !== undefined)  dbData.initial_balance_alt = data.initialBalanceAlt
    if (data.currencyId !== undefined)         dbData.currency_id = data.currencyId ?? null
    if (data.displayCurrencyIds !== undefined) dbData.display_currency_ids = data.displayCurrencyIds
    if (data.showPrimary !== undefined)        dbData.show_primary = data.showPrimary
    const { error } = await supabase.from('cdg_accounts').update(dbData).eq('id', id)
    if (error) throw error
    set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a) }))
  },

  deleteAccount: async (id) => {
    const { error } = await supabase.from('cdg_accounts').delete().eq('id', id)
    if (error) throw error
    set(s => ({
      accounts: s.accounts.filter(a => a.id !== id),
      transactions: s.transactions.map(t => t.accountId === id ? { ...t, accountId: '' } : t),
    }))
  },

  getAccountBalance: (accountId) => {
    const account = get().accounts.find(a => a.id === accountId)
    if (!account) return undefined
    const txs = get().transactions.filter(t => t.accountId === accountId)
    const balance    = account.initialBalance    + txs.reduce((sum, t) => t.type === 'income' ? sum + t.amount    : sum - t.amount,    0)
    const balanceAlt = account.initialBalanceAlt + txs.reduce((sum, t) => t.type === 'income' ? sum + t.amountAlt : sum - t.amountAlt, 0)
    return { account, balance, balanceAlt }
  },

  // ─── Monedas ─────────────────────────────────────────────────────────────────
  addCurrency: async (data) => {
    const id = uuid()
    const order = get().currencies.length
    const { data: row, error } = await supabase
      .from('cdg_currencies')
      .insert({
        id, wallet_id: wid(),
        code: data.code, symbol: data.symbol, name: data.name,
        factor: data.factor, source_url: data.sourceUrl ?? null, order,
      })
      .select().single()
    if (error) throw error
    const currency = currencyFromDb(row)
    set(s => ({ currencies: [...s.currencies, currency] }))
    return currency
  },

  updateCurrency: async (id, data) => {
    const dbData: Record<string, unknown> = {}
    if (data.code !== undefined)   dbData.code = data.code
    if (data.symbol !== undefined) dbData.symbol = data.symbol
    if (data.name !== undefined)   dbData.name = data.name
    if (data.factor !== undefined) dbData.factor = data.factor
    if (data.sourceUrl !== undefined) dbData.source_url = data.sourceUrl || null
    if (data.order !== undefined)  dbData.order = data.order
    const { error } = await supabase.from('cdg_currencies').update(dbData).eq('id', id)
    if (error) throw error
    set(s => ({ currencies: s.currencies.map(c => c.id === id ? { ...c, ...data } : c) }))
  },

  deleteCurrency: async (id) => {
    // No permitir borrar si alguna cuenta la usa (preferencial o adicional)
    const inUse = get().accounts.some(a => a.currencyId === id || a.displayCurrencyIds.includes(id))
    if (inUse) return { error: 'Hay cuentas que usan esta moneda.' }
    const { error } = await supabase.from('cdg_currencies').delete().eq('id', id)
    if (error) return { error: error.message }
    set(s => ({ currencies: s.currencies.filter(c => c.id !== id) }))
    return { error: null }
  },

  getCurrency: (id) => id ? get().currencies.find(c => c.id === id) : undefined,

  getRatesForCurrency: (id) =>
    get().currencyRates
      .filter(r => r.currencyId === id)
      .sort((a, b) => b.rateDate.localeCompare(a.rateDate)),

  refreshBcvRates: async () => {
    const walletId = get().walletId
    if (!walletId) return { error: 'Sin cartera activa' }
    const { data, error } = await supabase.rpc('cdg_update_bcv_rates', { p_wallet_id: walletId })
    if (error) return { error: error.message }
    // Recargar monedas (factor actualizado) y el histórico de tasas
    const [currs, rates] = await Promise.all([
      supabase.from('cdg_currencies').select('*').eq('wallet_id', walletId).order('order'),
      supabase.from('cdg_currency_rates').select('*').eq('wallet_id', walletId).order('rate_date', { ascending: false }),
    ])
    set({
      currencies:    (currs.data ?? []).map(currencyFromDb),
      currencyRates: (rates.data ?? []).map(currencyRateFromDb),
    })
    return { error: null, rate: (data as { rate?: number } | null)?.rate }
  },

  // ─── Períodos ────────────────────────────────────────────────────────────────
  addBudgetPeriod: async (month, year) => {
    const id = uuid()
    const name = periodName(month, year)
    // Desactivar todos los existentes en Supabase
    await supabase.from('cdg_budget_periods').update({ is_active: false }).eq('wallet_id', wid())
    const { data: row, error } = await supabase
      .from('cdg_budget_periods')
      .insert({ id, wallet_id: wid(), month, year, name, is_active: true })
      .select().single()
    if (error) throw error
    const period = budgetPeriodFromDb(row)
    set(s => ({ budgetPeriods: [...s.budgetPeriods.map(p => ({ ...p, isActive: false })), period] }))
    return period
  },

  setActivePeriod: async (id) => {
    await supabase.from('cdg_budget_periods').update({ is_active: false }).eq('wallet_id', wid())
    await supabase.from('cdg_budget_periods').update({ is_active: true }).eq('id', id)
    set(s => ({ budgetPeriods: s.budgetPeriods.map(p => ({ ...p, isActive: p.id === id })) }))
  },

  getActivePeriod: () => get().budgetPeriods.find(p => p.isActive),

  ensureCurrentPeriod: async () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()
    const existing = get().budgetPeriods.find(p => p.month === month && p.year === year)
    if (existing) {
      if (!existing.isActive) await get().setActivePeriod(existing.id)
      return existing
    }
    return get().addBudgetPeriod(month, year)
  },

  // ─── Presupuesto ─────────────────────────────────────────────────────────────
  upsertBudgetItem: async (periodId, categoryRef, amount, notes) => {
    const refKey = (r: CategoryRef) => `${r.categoryId}|${r.subcategoryId ?? ''}|${r.subSubcategoryId ?? ''}`
    const key = refKey(categoryRef)
    const existing = get().budgetItems.find(b => b.budgetPeriodId === periodId && refKey(b.categoryRef) === key)

    if (existing) {
      const { error } = await supabase.from('cdg_budget_items').update({ amount, notes }).eq('id', existing.id)
      if (error) throw error
      set(s => ({ budgetItems: s.budgetItems.map(b => b.id === existing.id ? { ...b, amount, notes } : b) }))
    } else {
      const id = uuid()
      const { data: row, error } = await supabase
        .from('cdg_budget_items')
        .insert({ id, wallet_id: wid(), budget_period_id: periodId, amount, notes, ...categoryRefToDb(categoryRef) })
        .select().single()
      if (error) throw error
      set(s => ({ budgetItems: [...s.budgetItems, budgetItemFromDb(row)] }))
    }
  },

  deleteBudgetItem: async (id) => {
    const { error } = await supabase.from('cdg_budget_items').delete().eq('id', id)
    if (error) throw error
    set(s => ({ budgetItems: s.budgetItems.filter(b => b.id !== id) }))
  },

  // ─── Transacciones ───────────────────────────────────────────────────────────
  addTransaction: async (data) => {
    const id = uuid()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: row, error } = await supabase
      .from('cdg_transactions')
      .insert({
        id, wallet_id: wid(), type: data.type,
        account_id: data.accountId || null,
        budget_period_id: data.budgetPeriodId,
        amount: data.amount, amount_alt: data.amountAlt,
        date: data.date, description: data.description, notes: data.notes ?? null,
        image_path: data.imageId ?? null,
        created_by: session?.user?.id ?? null,
        ...categoryRefToDb(data.categoryRef),
      })
      .select().single()
    if (error) throw error
    const tx = transactionFromDb(row)
    set(s => ({ transactions: [tx, ...s.transactions] }))
    return tx
  },

  updateTransaction: async (id, data) => {
    const dbData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.type !== undefined)           dbData.type = data.type
    if (data.accountId !== undefined)      dbData.account_id = data.accountId || null
    if (data.budgetPeriodId !== undefined) dbData.budget_period_id = data.budgetPeriodId
    if (data.amount !== undefined)         dbData.amount = data.amount
    if (data.amountAlt !== undefined)      dbData.amount_alt = data.amountAlt
    if (data.date !== undefined)           dbData.date = data.date
    if (data.description !== undefined)    dbData.description = data.description
    if (data.notes !== undefined)          dbData.notes = data.notes
    if (data.imageId !== undefined)        dbData.image_path = data.imageId ?? null
    if (data.categoryRef !== undefined)    Object.assign(dbData, categoryRefToDb(data.categoryRef))
    const { error } = await supabase.from('cdg_transactions').update(dbData).eq('id', id)
    if (error) throw error
    set(s => ({
      transactions: s.transactions.map(t =>
        t.id === id ? { ...t, ...data, updatedAt: dbData.updated_at as string } : t
      ),
    }))
  },

  deleteTransaction: async (id) => {
    const tx = get().transactions.find(t => t.id === id)
    if (tx?.imageId) deleteImage(tx.imageId)
    const { error } = await supabase.from('cdg_transactions').delete().eq('id', id)
    if (error) throw error
    set(s => ({
      transactions: s.transactions.filter(t => t.id !== id),
      // DB SET NULL on shopping_list_items.transaction_id — reflect locally
      shoppingListItems: s.shoppingListItems.map(i =>
        i.transactionId === id
          ? { ...i, checked: false, transactionId: undefined, actualAmount: undefined, actualAmountAlt: undefined }
          : i
      ),
    }))
  },

  // ─── Lista de compras ────────────────────────────────────────────────────────
  addShoppingList: async (name) => {
    const id = uuid()
    const { data: row, error } = await supabase
      .from('cdg_shopping_lists')
      .insert({ id, wallet_id: wid(), name })
      .select().single()
    if (error) throw error
    const list = shoppingListFromDb(row)
    set(s => ({ shoppingLists: [...s.shoppingLists, list] }))
    return list
  },

  updateShoppingList: async (id, name) => {
    const { error } = await supabase.from('cdg_shopping_lists').update({ name }).eq('id', id)
    if (error) throw error
    set(s => ({ shoppingLists: s.shoppingLists.map(l => l.id === id ? { ...l, name } : l) }))
  },

  deleteShoppingList: async (id) => {
    // Limpia imágenes de transacciones asociadas
    const itemIds = new Set(get().shoppingListItems.filter(i => i.listId === id).map(i => i.transactionId).filter(Boolean) as string[])
    get().transactions.filter(t => itemIds.has(t.id) && t.imageId).forEach(t => deleteImage(t.imageId!))
    // DB CASCADE borra items; transactions quedan (solo se desvínculan via SET NULL en items)
    const { error } = await supabase.from('cdg_shopping_lists').delete().eq('id', id)
    if (error) throw error
    set(s => ({
      shoppingLists:     s.shoppingLists.filter(l => l.id !== id),
      shoppingListItems: s.shoppingListItems.filter(i => i.listId !== id),
    }))
  },

  addShoppingListItem: async (data) => {
    const id = uuid()
    const { data: row, error } = await supabase
      .from('cdg_shopping_list_items')
      .insert({
        id, wallet_id: wid(), list_id: data.listId, name: data.name,
        estimated_amount: data.estimatedAmount, estimated_amount_alt: data.estimatedAmountAlt,
        notes: data.notes ?? null,
        ...categoryRefToDb(data.categoryRef),
      })
      .select().single()
    if (error) throw error
    const item = shoppingListItemFromDb(row)
    set(s => ({ shoppingListItems: [...s.shoppingListItems, item] }))
    return item
  },

  updateShoppingListItem: async (id, data) => {
    const dbData: Record<string, unknown> = {}
    if (data.name !== undefined)                dbData.name = data.name
    if (data.estimatedAmount !== undefined)     dbData.estimated_amount = data.estimatedAmount
    if (data.estimatedAmountAlt !== undefined)  dbData.estimated_amount_alt = data.estimatedAmountAlt
    if (data.notes !== undefined)               dbData.notes = data.notes
    if (data.categoryRef !== undefined)         Object.assign(dbData, categoryRefToDb(data.categoryRef))
    if (data.checked !== undefined)             dbData.checked = data.checked
    if (data.transactionId !== undefined)       dbData.transaction_id = data.transactionId ?? null
    if (data.actualAmount !== undefined)        dbData.actual_amount = data.actualAmount ?? null
    if (data.actualAmountAlt !== undefined)     dbData.actual_amount_alt = data.actualAmountAlt ?? null
    const { error } = await supabase.from('cdg_shopping_list_items').update(dbData).eq('id', id)
    if (error) throw error
    set(s => ({ shoppingListItems: s.shoppingListItems.map(i => i.id === id ? { ...i, ...data } : i) }))
  },

  deleteShoppingListItem: async (id) => {
    const item = get().shoppingListItems.find(i => i.id === id)
    if (item?.transactionId) {
      const tx = get().transactions.find(t => t.id === item.transactionId)
      if (tx?.imageId) deleteImage(tx.imageId)
      await supabase.from('cdg_transactions').delete().eq('id', item.transactionId)
    }
    const { error } = await supabase.from('cdg_shopping_list_items').delete().eq('id', id)
    if (error) throw error
    set(s => ({
      shoppingListItems: s.shoppingListItems.filter(i => i.id !== id),
      transactions: item?.transactionId
        ? s.transactions.filter(t => t.id !== item.transactionId)
        : s.transactions,
    }))
  },

  checkShoppingListItem: async (id, amount, amountAlt, accountId) => {
    const item = get().shoppingListItems.find(i => i.id === id)
    if (!item || item.checked) return
    const activePeriod = get().budgetPeriods.find(p => p.isActive)
    if (!activePeriod) return
    const tx = await get().addTransaction({
      type: 'expense', accountId, budgetPeriodId: activePeriod.id,
      categoryRef: item.categoryRef, amount, amountAlt,
      date: todayISO(), description: item.name, notes: item.notes,
    })
    await get().updateShoppingListItem(id, {
      checked: true, transactionId: tx.id, actualAmount: amount, actualAmountAlt: amountAlt,
    })
  },

  uncheckShoppingListItem: async (id) => {
    const item = get().shoppingListItems.find(i => i.id === id)
    if (!item?.checked) return
    if (item.transactionId) {
      const tx = get().transactions.find(t => t.id === item.transactionId)
      if (tx?.imageId) deleteImage(tx.imageId)
      await supabase.from('cdg_transactions').delete().eq('id', item.transactionId)
    }
    const { error } = await supabase
      .from('cdg_shopping_list_items')
      .update({ checked: false, transaction_id: null, actual_amount: null, actual_amount_alt: null })
      .eq('id', id)
    if (error) throw error
    set(s => ({
      shoppingListItems: s.shoppingListItems.map(i =>
        i.id === id ? { ...i, checked: false, transactionId: undefined, actualAmount: undefined, actualAmountAlt: undefined } : i
      ),
      transactions: item.transactionId
        ? s.transactions.filter(t => t.id !== item.transactionId)
        : s.transactions,
    }))
  },

  // ─── Settings ────────────────────────────────────────────────────────────────
  updateSettings: async (data) => {
    const dbData: Record<string, unknown> = {}
    if (data.currencySymbol !== undefined)    dbData.currency_symbol = data.currencySymbol
    if (data.currencyCode !== undefined)      dbData.currency_code = data.currencyCode
    if (data.currencyName !== undefined)      dbData.currency_name = data.currencyName
    if (data.locale !== undefined)            dbData.locale = data.locale
    if (data.warningThreshold !== undefined)  dbData.warning_threshold = data.warningThreshold
    const { error } = await supabase.from('cdg_wallet_settings').update(dbData).eq('wallet_id', wid())
    if (error) throw error
    set(s => ({ settings: { ...s.settings, ...data } }))
  },
}))
