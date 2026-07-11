import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { CategoryList } from '../components/categories/CategoryList'
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet'
import { CurrencySettingsForm } from '../components/config/CurrencySettingsForm'
import { MembersTab } from '../components/config/MembersTab'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

type Tab = 'categorias' | 'monedas' | 'miembros'

export function ConfigPage() {
  const { currentWalletId, currentWalletType } = useAuthStore()
  const [tab, setTab]         = useState<Tab>('categorias')
  const [formOpen, setFormOpen] = useState(false)
  const [isAdmin, setIsAdmin]   = useState(false)
  const isGroup = currentWalletType === 'family'

  useEffect(() => {
    if (!currentWalletId) return
    supabase.rpc('cdg_wallet_role', { p_wallet_id: currentWalletId })
      .then(({ data }) => setIsAdmin(data === 'admin'))
  }, [currentWalletId])

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Configuración"
        right={
          tab === 'categorias' ? (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1 bg-brand-500 text-white text-sm font-medium px-3 py-1.5 rounded-xl"
            >
              <Plus size={16} /> Nueva
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="px-4 pt-2 flex gap-2">
        <button
          onClick={() => setTab('categorias')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'categorias' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}
        >
          Categorías
        </button>
        <button
          onClick={() => setTab('monedas')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'monedas' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}
        >
          Monedas
        </button>
        {isGroup && isAdmin && (
          <button
            onClick={() => setTab('miembros')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'miembros' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            Miembros
          </button>
        )}
      </div>

      {tab === 'categorias' && (
        <>
          <CategoryList />
          <CategoryFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
        </>
      )}

      {tab === 'monedas' && (
        <div className="px-4 py-5">
          <CurrencySettingsForm />
        </div>
      )}

      {tab === 'miembros' && isGroup && <MembersTab />}
    </div>
  )
}
