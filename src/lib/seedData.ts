import { useDataStore } from '../store/dataStore'
import { todayISO } from './formatters'

export async function seedData() {
  const store = useDataStore.getState()

  await store.updateSettings({
    currencySymbol: '$', currencyCode: 'ARS', currencyName: 'Peso Argentino',
    locale: 'es-AR', warningThreshold: 0.80,
  })

  // Moneda secundaria de ejemplo (1 $ = 0.001 U$S, es decir 1 U$S = $1.000)
  const dolar = await store.addCurrency({ code: 'USD', symbol: 'U$S', name: 'Dólar', factor: 0.001 })

  // Cuentas
  const efectivo = await store.addAccount({ name: 'Efectivo',    icon: 'Wallet',      color: '#22c55e', type: 'cash',    initialBalance: 50000,  initialBalanceAlt: 0, currencyId: undefined, displayCurrencyIds: [dolar.id], showPrimary: false })
  const banco    = await store.addAccount({ name: 'Banco Nación',icon: 'Building2',   color: '#3b82f6', type: 'bank',    initialBalance: 200000, initialBalanceAlt: 0, currencyId: undefined, displayCurrencyIds: [dolar.id], showPrimary: false })
  const ahorro   = await store.addAccount({ name: 'Ahorro USD',  icon: 'DollarSign',  color: '#f59e0b', type: 'savings', initialBalance: 500000, initialBalanceAlt: 0, currencyId: undefined, displayCurrencyIds: [dolar.id], showPrimary: false })

  // Categorías
  const alim = await store.addCategory({ name: 'Alimentación', icon: 'ShoppingCart', color: '#22c55e' })
  const trans = await store.addCategory({ name: 'Transporte',  icon: 'Car',          color: '#3b82f6' })
  const hogar = await store.addCategory({ name: 'Hogar',       icon: 'Home',         color: '#f97316' })
  const salud = await store.addCategory({ name: 'Salud',       icon: 'HeartPulse',   color: '#ec4899' })
  const ocio  = await store.addCategory({ name: 'Ocio',        icon: 'Music',        color: '#8b5cf6' })

  // Subcategorías
  const super_ = await store.addSubcategory(alim.id, 'Supermercado')
  const rest   = await store.addSubcategory(alim.id, 'Restaurantes')
  const cafe   = await store.addSubcategory(alim.id, 'Cafeterías')

  await store.addSubSubcategory(super_.id, 'Frutas y verduras')
  await store.addSubSubcategory(super_.id, 'Carnes')
  await store.addSubSubcategory(super_.id, 'Limpieza')

  const comb = await store.addSubcategory(trans.id, 'Combustible')
  const taxi = await store.addSubcategory(trans.id, 'Taxi / Uber')
  await store.addSubcategory(trans.id, 'Transporte público')

  await store.addSubcategory(hogar.id, 'Alquiler')
  const serv = await store.addSubcategory(hogar.id, 'Servicios')
  await store.addSubSubcategory(serv.id, 'Luz')
  await store.addSubSubcategory(serv.id, 'Gas')
  await store.addSubSubcategory(serv.id, 'Internet')

  await store.addSubcategory(salud.id, 'Farmacia')
  await store.addSubcategory(salud.id, 'Médico')
  await store.addSubcategory(ocio.id, 'Streaming')
  await store.addSubcategory(ocio.id, 'Salidas')

  const period = await store.ensureCurrentPeriod()

  await store.upsertBudgetItem(period.id, { level: 'category',    categoryId: alim.id }, 50000)
  await store.upsertBudgetItem(period.id, { level: 'subcategory', categoryId: alim.id, subcategoryId: super_.id }, 30000)
  await store.upsertBudgetItem(period.id, { level: 'subcategory', categoryId: alim.id, subcategoryId: rest.id },  15000)
  await store.upsertBudgetItem(period.id, { level: 'category',    categoryId: trans.id }, 20000)
  await store.upsertBudgetItem(period.id, { level: 'subcategory', categoryId: trans.id, subcategoryId: comb.id }, 12000)
  await store.upsertBudgetItem(period.id, { level: 'category',    categoryId: hogar.id }, 80000)
  await store.upsertBudgetItem(period.id, { level: 'category',    categoryId: salud.id }, 10000)
  await store.upsertBudgetItem(period.id, { level: 'category',    categoryId: ocio.id  }, 15000)

  const today = todayISO()
  const [year, month] = today.split('-').map(Number)
  const fmt = (d: number) => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const alt = (amount: number) => Math.round(amount / 1000 * 100) / 100

  await store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: super_.id }, amount: 8500,   amountAlt: alt(8500),   date: fmt(2), description: 'Compra semanal Carrefour' })
  await store.addTransaction({ type: 'expense', accountId: efectivo.id, budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: rest.id   }, amount: 3200,   amountAlt: alt(3200),   date: fmt(4), description: 'Almuerzo con colegas' })
  await store.addTransaction({ type: 'expense', accountId: efectivo.id, budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: cafe.id   }, amount: 950,    amountAlt: alt(950),    date: fmt(5), description: 'Café y medialunas' })
  await store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: trans.id, subcategoryId: comb.id  }, amount: 7000,   amountAlt: alt(7000),   date: fmt(3), description: 'Carga de combustible' })
  await store.addTransaction({ type: 'expense', accountId: efectivo.id, budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: trans.id, subcategoryId: taxi.id  }, amount: 1800,   amountAlt: alt(1800),   date: fmt(6), description: 'Uber al aeropuerto' })
  await store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'category',    categoryId: salud.id                          }, amount: 4500,   amountAlt: alt(4500),   date: fmt(1), description: 'Farmacia' })
  await store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'category',    categoryId: ocio.id                           }, amount: 3990,   amountAlt: alt(3990),   date: fmt(1), description: 'Netflix + Spotify' })
  await store.addTransaction({ type: 'expense', accountId: banco.id,    budgetPeriodId: period.id, categoryRef: { level: 'subcategory', categoryId: alim.id, subcategoryId: super_.id }, amount: 9200,   amountAlt: alt(9200),   date: fmt(9), description: 'Verdulería y carnicería' })
  await store.addTransaction({ type: 'income',  accountId: banco.id,    budgetPeriodId: period.id, amount: 350000, amountAlt: alt(350000), date: fmt(1), description: 'Sueldo' })
  await store.addTransaction({ type: 'income',  accountId: ahorro.id,   budgetPeriodId: period.id, amount: 50000,  amountAlt: alt(50000),  date: fmt(5), description: 'Renta alquiler' })
}
