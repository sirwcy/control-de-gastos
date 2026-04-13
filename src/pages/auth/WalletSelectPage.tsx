import { useState, useEffect } from 'react'
import { User, Users, ChevronRight, Plus, LogOut, TrendingDown, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface WalletEntry {
  id:   string
  name: string
  type: 'personal' | 'family'
  role: string
}

const ROLE_LABEL: Record<string, string> = {
  admin:    'Administrador',
  executor: 'Ejecutor',
  reader:   'Lector',
}

export function WalletSelectPage() {
  const { user, setCurrentWallet, signOut } = useAuthStore()

  const [wallets, setWallets]   = useState<WalletEntry[]>([])
  const [fetching, setFetching] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]   = useState('')
  const [newType, setNewType]   = useState<'personal' | 'family'>('personal')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    loadWallets()
  }, [])

  async function loadWallets() {
    setFetching(true)
    const { data: memberships } = await supabase
      .from('cdg_wallet_members')
      .select('wallet_id, role')

    if (memberships && memberships.length > 0) {
      const ids = memberships.map(m => m.wallet_id)
      const { data: walletData } = await supabase
        .from('cdg_wallets')
        .select('id, name, type')
        .in('id', ids)
        .order('created_at')

      setWallets(
        (walletData ?? []).map(w => ({
          ...w,
          type: w.type as 'personal' | 'family',
          role: memberships.find(m => m.wallet_id === w.id)?.role ?? 'reader',
        }))
      )
    }
    setFetching(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !user) return
    setCreating(true)
    setCreateError(null)

    const { data, error } = await supabase
      .from('cdg_wallets')
      .insert({ name: newName.trim(), type: newType, owner_id: user.id })
      .select('id')
      .single()

    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }
    // setCurrentWallet dispara el redirect via WalletRoute en App.tsx
    setCurrentWallet(data.id)
  }

  return (
    <div className="min-h-svh bg-slate-50 flex flex-col px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <TrendingDown size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base">Tus Carteras</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs text-slate-400 py-1.5 px-3 rounded-xl bg-white shadow-sm"
        >
          <LogOut size={13} /> Salir
        </button>
      </div>

      {fetching ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 space-y-3">
          {wallets.length === 0 && !showCreate && (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500 mb-1">No tenés carteras aún.</p>
              <p className="text-xs text-slate-400">Creá una para empezar.</p>
            </div>
          )}

          {wallets.map(w => (
            <button
              key={w.id}
              onClick={() => setCurrentWallet(w.id)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm text-left"
            >
              <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                {w.type === 'family'
                  ? <Users size={20} className="text-brand-500" />
                  : <User size={20} className="text-brand-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{w.name}</p>
                <p className="text-xs text-slate-400">
                  {w.type === 'family' ? 'Familiar' : 'Personal'} · {ROLE_LABEL[w.role] ?? w.role}
                </p>
              </div>
              <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
            </button>
          ))}

          {/* Formulario de nueva cartera */}
          {showCreate ? (
            <form
              onSubmit={handleCreate}
              className="bg-white rounded-2xl shadow-sm p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Nueva cartera</h3>
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(null) }}>
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nombre</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="ej: Gastos del hogar"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">Tipo de cartera</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('personal')}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors ${
                      newType === 'personal'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <User size={22} className={newType === 'personal' ? 'text-brand-600' : 'text-slate-400'} />
                    <span className={`text-xs font-semibold ${newType === 'personal' ? 'text-brand-600' : 'text-slate-500'}`}>
                      Personal
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('family')}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors ${
                      newType === 'family'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <Users size={22} className={newType === 'family' ? 'text-brand-600' : 'text-slate-400'} />
                    <span className={`text-xs font-semibold ${newType === 'family' ? 'text-brand-600' : 'text-slate-500'}`}>
                      Familiar
                    </span>
                  </button>
                </div>
                {newType === 'family' && (
                  <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                    Podrás invitar miembros desde el panel de administración
                  </p>
                )}
              </div>

              {createError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{createError}</p>
              )}

              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="w-full py-3.5 bg-brand-500 text-white font-bold rounded-2xl disabled:opacity-40 text-sm"
              >
                {creating ? 'Creando...' : 'Crear cartera'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 font-medium"
            >
              <Plus size={16} /> Nueva cartera
            </button>
          )}
        </div>
      )}
    </div>
  )
}
