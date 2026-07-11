import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { TopBar } from './components/layout/TopBar'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AccountsPage } from './pages/AccountsPage'
import { BudgetPage } from './pages/BudgetPage'
import { ConfigPage } from './pages/ConfigPage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import { TransactionFormSheet } from './components/transactions/TransactionFormSheet'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { WalletSelectPage } from './pages/auth/WalletSelectPage'
import { useDataStore } from './store/dataStore'
import { useAuthStore } from './store/authStore'
import { seedData } from './lib/seedData'

// ─── Spinner de carga ────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-svh bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Rutas públicas: redirige al app si ya está autenticado ──────────────────
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, currentWalletId, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (user && currentWalletId)  return <Navigate to="/" replace />
  if (user && !currentWalletId) return <Navigate to="/select-wallet" replace />
  return <>{children}</>
}

// ─── Ruta de selección de cartera: requiere auth pero no wallet ───────────────
function WalletRoute({ children }: { children: React.ReactNode }) {
  const { user, currentWalletId, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (currentWalletId) return <Navigate to="/" replace />
  return <>{children}</>
}

// ─── Rutas protegidas: requiere auth + cartera seleccionada ──────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, currentWalletId, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!currentWalletId) return <Navigate to="/select-wallet" replace />
  return <>{children}</>
}

// ─── App principal (envuelta en AuthGuard) ───────────────────────────────────
function MainApp() {
  const { ensureCurrentPeriod, categories, loading } = useDataStore()

  useEffect(() => {
    if (!loading) {
      ensureCurrentPeriod()
      if (categories.length === 0) seedData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <div className="relative min-h-svh pb-nav">
      <TopBar />
      <Routes>
        <Route path="/"            element={<DashboardPage />} />
        <Route path="/movimientos" element={<TransactionsPage />} />
        <Route path="/cuentas"     element={<AccountsPage />} />
        <Route path="/presupuesto" element={<BudgetPage />} />
        <Route path="/compras"     element={<ShoppingListPage />} />
        <Route path="/config"      element={<ConfigPage />} />
      </Routes>
      <BottomNav />
      <TransactionFormSheet />
    </div>
  )
}

// ─── Raíz ────────────────────────────────────────────────────────────────────
function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Requiere auth, sin cartera */}
        <Route path="/select-wallet" element={<WalletRoute><WalletSelectPage /></WalletRoute>} />

        {/* Protegidas: requiere auth + cartera */}
        <Route path="/*" element={<AuthGuard><MainApp /></AuthGuard>} />
      </Routes>
    </HashRouter>
  )
}

export default App
