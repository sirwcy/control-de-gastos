import { useDataStore } from '../store/dataStore'
import { todayISO } from './formatters'

export function seedData() {
  const store = useDataStore.getState()

  // Configurar monedas con factor de conversión de ejemplo
  store.updateSettings({
    currencySymbol: '$', currencyCode: 'ARS', currencyName: 'Peso Argentino',
    altCurrencySymbol: 'U$S', altCurrencyCode: 'USD', altCurrencyName: 'Dólar',
    conversionFactor: 1000, // $1.000 = U$S 1
    locale: 'es-AR',
    warningThreshold: 0.80,
  })

  // Cuentas
  const efectivo = store.addAccount({ name: 'Efectivo', icon: 'Wallet', color: '#22c55e', type: 'cash', initialBalance: 50000, initialBalanceAlt: 50 })
  const banco    = store.addAccount({ name: 'Banco Nación', icon: 'Building2', color: '#3b82f6', type: 'bank', initialBalance: 200000, initialBalanceAlt: 200 })
  const ahorro   = store.addAccount({ name: 'Ahorro USD', icon: 'DollarSign', color: '#f59e0b', type: 'savings', initialBalance: 500000, initialBalanceAlt: 500 })

  // Categorías
  const alim = store.addCategory({ name: 'Alimentación', icon: 'ShoppingCart', color: '#22c55e' })
  const trans = store.addCategory({ name: 'Transporte',  icon: 'Car',          color: '#3b82f6' })
  const hogar = store.addCategory({ name: 'Hogar',       icon: 'Home',         color: '#f97316' })
  const salud = store.addCategory({ name: 'Salud',       icon: 'HeartPulse',   color: '#ec4899' })
  const ocio  = store.addCategory({ name: 'Ocio',        icon: 'Music',        color: '#8b5cf6' })

  // Subcategorías de Alimentación
  const super_ = store.addSubcategory(alim.id, 'Supermercado')
  const rest   = store.addSubcategory(alim.id, 'Restaurantes')
  const cafe   = store.addSubcategory(alim.id, 'Cafeterías')

  // Sub-subcategorías de Supermercado
  store.addSubSubcategory(super_.id, 'Frutas y verduras')
  store.addSubSubcategory(super_.id, 'Carnes')
  store.addSubSubcategory(super_.id, 'Limpieza')

  // Subcategorías de Transporte
  const comb = store.addSubcategory(trans.id, 'Combustible')
  const taxi = store.addSubcategory(trans.id, 'Taxi / Uber')
  store.addSubcategory(trans.id, 'Transporte público')

  // Subcategorías de Hogar
  store.addSubcategory(hogar.id, 'Alquiler')
  const serv = store.addSubcategory(hogar.id, 'Servicios')
  store.addSubSubcategory(serv.id, 'Luz')
  store.addSubSubcategory(serv.id, 'Gas')
  store.addSubSubcategory(serv.id, 'Internet')

  // Subcategorías de Salud
  store.addSubcategory(salud.id, 'Farmacia')
  store.addSubcategory(salud.id, 'Médico')

  // Subcategorías de Ocio
  store.addSubcategory(ocio.id, 'Streaming')
  store.addSubcategory(ocio.id, 'Salidas')

  // Asegurar período activo
  const period = store.ensureCurrentPeriod()

  // Presupuesto de ejemplo
  store.upsertBudgetItem(period.id, { level: 'category', categoryId: alim.id }, 50000)
  store.upsertBudgetItem(period.id, { level: 'subcategory', categoryId: alim.id, subcategoryId: super_.id }, 30000)
  store.upsertBudgetItem(period.id, { level: 'subcategory', categoryId: alim.id, subcategoryId: rest.id }, 15000)
  store.upsertBudgetItem(period.id, { level: 'category', categoryId: trans.id }, 20000)
  store.upsertBudgetItem(period.id, { level: 'subcategory', categoryId: trans.id, subcategoryId: comb.id }, 12000)
  store.upsertBudgetItem(period.id, { level: 'category', categoryId: hogar.id }, 80000)
  store.upsertBudgetItem(period.id, { level: 'category', categoryId: salud.id }, 10000)
  store.upsertBudgetItem(period.id, { level: 'category', categoryId: ocio.id }, 15000)

  // Transacciones de ejemplo
  const today = todayISO()
  const [year, month] = today.split('-').map(Number)
  const fmt = (d: number) => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  // factor = 1000 → amountAlt = amount / 1000
  const alt = (amount: number) => Math.round(amount / 1000 * 100) / 100

  // Gastos
  store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: super_.id }, amount: 8500,  amountAlt: alt(8500),  date: fmt(2), description: 'Compra semanal Carrefour' })
  store.addTransaction({ type: 'expense', accountId: efectivo.id, budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: rest.id },   amount: 3200,  amountAlt: alt(3200),  date: fmt(4), description: 'Almuerzo con colegas' })
  store.addTransaction({ type: 'expense', accountId: efectivo.id, budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: cafe.id },   amount: 950,   amountAlt: alt(950),   date: fmt(5), description: 'Café y medialunas' })
  store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: trans.id, subcategoryId: comb.id },  amount: 7000,  amountAlt: alt(7000),  date: fmt(3), description: 'Carga de combustible' })
  store.addTransaction({ type: 'expense', accountId: efectivo.id, budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: trans.id, subcategoryId: taxi.id },  amount: 1800,  amountAlt: alt(1800),  date: fmt(6), description: 'Uber al aeropuerto' })
  store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'category',    categoryId: salud.id },                          amount: 4500,  amountAlt: alt(4500),  date: fmt(1), description: 'Farmacia' })
  store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'category',    categoryId: ocio.id },                           amount: 3990,  amountAlt: alt(3990),  date: fmt(1), description: 'Netflix + Spotify' })
  store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: super_.id }, amount: 9200,  amountAlt: alt(9200),  date: fmt(9), description: 'Verdulería y carnicería' })

  // Ingresos
  store.addTransaction({ type: 'income', accountId: banco.id,  budgetPeriodId: period.id, amount: 350000, amountAlt: alt(350000), date: fmt(1), description: 'Sueldo' })
  store.addTransaction({ type: 'income', accountId: ahorro.id, budgetPeriodId: period.id, amount: 50000,  amountAlt: alt(50000),  date: fmt(5), description: 'Renta alquiler' })
}
