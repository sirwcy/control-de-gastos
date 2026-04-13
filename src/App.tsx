import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AccountsPage } from './pages/AccountsPage'
import { BudgetPage } from './pages/BudgetPage'
import { ConfigPage } from './pages/ConfigPage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import { TransactionFormSheet } from './components/transactions/TransactionFormSheet'
import { useDataStore } from './store/dataStore'
import { seedData } from './lib/seedData'

function App() {
  const { ensureCurrentPeriod, categories } = useDataStore()

  useEffect(() => {
    ensureCurrentPeriod()
    if (categories.length === 0) {
      seedData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <HashRouter>
      <div className="relative min-h-svh pb-nav">
        <Routes>
          <Route path="/"             element={<DashboardPage />} />
          <Route path="/movimientos"  element={<TransactionsPage />} />
          <Route path="/cuentas"      element={<AccountsPage />} />
          <Route path="/presupuesto"  element={<BudgetPage />} />
          <Route path="/compras"      element={<ShoppingListPage />} />
          <Route path="/config"       element={<ConfigPage />} />
        </Routes>
        <BottomNav />
        <TransactionFormSheet />
      </div>
    </HashRouter>
  )
}

export default App
