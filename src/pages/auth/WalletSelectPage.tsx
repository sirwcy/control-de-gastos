import { useState, useEffect } from 'react'
import { User, Users, ChevronRight, Plus, LogOut, TrendingDown, X, Mail } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface WalletEntry {
  id:   string
  name: string
  type: 'personal' | 'family'
  role: string
  memberCount: number
}

interface PendingInvite {
  id:          string
  wallet_id:   string
  wallet_name: string
  role:        string
  token:       string
}

const ROLE_LABEL: Record<string, string> = {
  admin:    'Administrador',
  executor: 'Ejecutor',
  reader:   'Lector',
}

export function WalletSelectPage() {
  const { user, setCurrentWallet, signOut } = useAuthStore()

  const [wallets,      setWallets]      = useState<WalletEntry[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [fetching,     setFetching]     = useState(true)
  const [showCreate,   setShowCreate]   = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newType,      setNewType]      = useState<'personal' | 'family'>('personal')
  const [creating,     setCreating]     = useState(false)
  const [createError,  setCreateError]  = useState<string | null>(null)
  const [accepting,    setAccepting]    = useState<string | null>(null)

  useEffect(() => { loadWallets() }, [])

  async function loadWallets() {
    setFetching(true)

    const [membershipsRes, invitesRes] = await Promise.all([
      // La RLS devuelve TODOS los miembros de las carteras del usuario, no solo su fila.
      supabase.from('cdg_wallet_members').select('wallet_id, user_id, role'),
      supabase
        .from('cdg_invitations')
        .select('id, wallet_id, role, token, cdg_wallets(name)')
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString()),
    ])

    if (membershipsRes.data && membershipsRes.data.length > 0) {
      const memberRows = membershipsRes.data
      const ids = [...new Set(memberRows.map(m => m.wallet_id))]

      // Cantidad de miembros por cartera (a partir de las filas ya traídas)
      const countByWallet = new Map<string, number>()
      for (const m of memberRows) countByWallet.set(m.wallet_id, (countByWallet.get(m.wallet_id) ?? 0) + 1)

      const { data: walletData } = await supabase
        .from('cdg_wallets')
        .select('id, name, type')
        .in('id', ids)
        .order('created_at')

      setWallets(
        (walletData ?? []).map(w => ({
          ...w,
          type: w.type as 'personal' | 'family',
          // El rol es el de MI fila en esta cartera, no el del primer miembro.
          role: memberRows.find(m => m.wallet_id === w.id && m.user_id === user?.id)?.role ?? 'reader',
          memberCount: countByWallet.get(w.id) ?? 1,
        }))
      )
    }

    setPendingInvites(
      (invitesRes.data ?? []).map((inv: { id: string; wallet_id: string; role: string; token: string; cdg_wallets: { name: string }[] | null }) => ({
        id:          inv.id,
        wallet_id:   inv.wallet_id,
        wallet_name: inv.cdg_wallets?.[0]?.name ?? '—',
        role:        inv.role,
        token:       inv.token,
      }))
    )

    setFetching(false)
  }

  async function handleAcceptInvite(token: string) {
    setAccepting(token)
    const { data, error } = await supabase.rpc('cdg_accept_invitation', { p_token: token })
    setAccepting(null)
    if (error || data?.error) return
    // Recargar y entrar directamente a la cartera aceptada
    await loadWallets()
    if (data?.wallet_id) setCurrentWallet(data.wallet_id)
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
          {wallets.length === 0 && pendingInvites.length === 0 && !showCreate && (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500 mb-1">No tenés carteras aún.</p>
              <p className="text-xs text-slate-400">Creá una para empezar.</p>
            </div>
          )}

          {/* Invitaciones pendientes */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">
                Invitaciones pendientes
              </p>
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate text-sm">{inv.wallet_name}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABEL[inv.role] ?? inv.role} · Invitación pendiente
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptInvite(inv.token)}
                    disabled={accepting === inv.token}
                    className="text-xs font-bold text-amber-700 bg-amber-200 px-3 py-1.5 rounded-xl disabled:opacity-50 flex-shrink-0"
                  >
                    {accepting === inv.token ? '...' : 'Aceptar'}
                  </button>
                </div>
              ))}
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
                  {w.type === 'family'
                    ? `Grupal · ${w.memberCount} ${w.memberCount === 1 ? 'miembro' : 'miembros'} · ${ROLE_LABEL[w.role] ?? w.role}`
                    : `Personal · ${ROLE_LABEL[w.role] ?? w.role}`}
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
                      Grupal
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  {newType === 'family'
                    ? 'Podrás invitar o crear miembros desde el panel de administración.'
                    : 'Cartera individual: sin miembros ni invitaciones.'}
                </p>
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
