import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Shield, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

interface Member {
  id: string
  user_id: string
  role: 'admin' | 'executor' | 'reader'
  created_at: string
  profile: { display_name: string; username: string | null } | null
}

interface Invitation {
  id: string
  email: string
  role: 'executor' | 'reader'
  created_at: string
  expires_at: string
}

const ROLE_LABEL: Record<string, string> = {
  admin:    'Administrador',
  executor: 'Ejecutor',
  reader:   'Lector',
}

const ROLE_CHIP: Record<string, string> = {
  admin:    'bg-brand-100 text-brand-700',
  executor: 'bg-blue-100 text-blue-700',
  reader:   'bg-slate-100 text-slate-600',
}

// Extrae el mensaje de error del cuerpo JSON de una Edge Function fallida
async function extractFnError(error: unknown): Promise<string> {
  try {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json()
      if (body?.error) return String(body.error)
    }
  } catch { /* ignore */ }
  return (error as Error)?.message ?? 'No se pudo crear el usuario'
}

export function MembersTab() {
  const { user, currentWalletId } = useAuthStore()

  const [members,     setMembers]     = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [myRole,      setMyRole]      = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState<string | null>(null)

  // Invite form
  const [invEmail,   setInvEmail]   = useState('')
  const [invRole,    setInvRole]    = useState<'executor' | 'reader'>('executor')
  const [inviting,   setInviting]   = useState(false)
  const [invError,   setInvError]   = useState<string | null>(null)
  const [invSuccess, setInvSuccess] = useState(false)

  // Crear usuario directamente
  const [cuName,     setCuName]     = useState('')
  const [cuUsername, setCuUsername] = useState('')
  const [cuEmail,    setCuEmail]    = useState('')
  const [cuPassword, setCuPassword] = useState('')
  const [cuRole,     setCuRole]     = useState<'executor' | 'reader'>('executor')
  const [creating,   setCreating]   = useState(false)
  const [cuError,    setCuError]    = useState<string | null>(null)
  const [cuSuccess,  setCuSuccess]  = useState<string | null>(null)

  useEffect(() => { load() }, [currentWalletId])

  async function load() {
    if (!currentWalletId) return
    setLoading(true)
    setLoadError(null)

    const [membersRes, invitesRes, roleRes] = await Promise.all([
      supabase
        .from('cdg_wallet_members')
        .select('id, user_id, role, created_at')
        .eq('wallet_id', currentWalletId)
        .order('created_at'),
      supabase
        .from('cdg_invitations')
        .select('id, email, role, created_at, expires_at')
        .eq('wallet_id', currentWalletId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
      supabase.rpc('cdg_wallet_role', { p_wallet_id: currentWalletId }),
    ])

    if (membersRes.error) setLoadError(membersRes.error.message)

    const rawMembers = (membersRes.data ?? []) as Omit<Member, 'profile'>[]

    // Los perfiles se traen aparte: no hay FK members→profiles para embeber.
    let profileMap = new Map<string, { display_name: string; username: string | null }>()
    const userIds = rawMembers.map(m => m.user_id)
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('cdg_profiles')
        .select('id, display_name, username')
        .in('id', userIds)
      profileMap = new Map((profs ?? []).map(p => [p.id, { display_name: p.display_name, username: p.username }]))
    }

    setMembers(rawMembers.map(m => ({ ...m, profile: profileMap.get(m.user_id) ?? null })))
    setInvitations((invitesRes.data ?? []) as Invitation[])
    setMyRole(roleRes.data ?? null)
    setLoading(false)
  }

  async function handleChangeRole(memberId: string, newRole: 'admin' | 'executor' | 'reader') {
    await supabase
      .from('cdg_wallet_members')
      .update({ role: newRole })
      .eq('id', memberId)
    setMembers(ms => ms.map(m => m.id === memberId ? { ...m, role: newRole } : m))
  }

  async function handleRemove(memberId: string) {
    await supabase
      .from('cdg_wallet_members')
      .delete()
      .eq('id', memberId)
    setMembers(ms => ms.filter(m => m.id !== memberId))
  }

  async function handleRevokeInvite(inviteId: string) {
    await supabase.from('cdg_invitations').delete().eq('id', inviteId)
    setInvitations(is => is.filter(i => i.id !== inviteId))
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!invEmail.trim() || !user || !currentWalletId) return
    setInviting(true)
    setInvError(null)
    setInvSuccess(false)

    const { error } = await supabase
      .from('cdg_invitations')
      .insert({
        wallet_id:  currentWalletId,
        email:      invEmail.trim().toLowerCase(),
        role:       invRole,
        invited_by: user.id,
      })

    if (error) {
      setInvError(error.message)
    } else {
      setInvSuccess(true)
      setInvEmail('')
      load()
    }
    setInviting(false)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!currentWalletId) return
    const username = cuUsername.trim().toLowerCase()
    setCuError(null)
    setCuSuccess(null)

    if (!/^[a-z0-9._-]{3,20}$/.test(username)) {
      setCuError('Usuario inválido (3-20 caracteres: letras, números, . _ -)')
      return
    }
    if (cuPassword.length < 6) {
      setCuError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCreating(true)

    const { data, error } = await supabase.functions.invoke('create-member', {
      body: {
        wallet_id:    currentWalletId,
        email:        cuEmail.trim().toLowerCase(),
        username,
        display_name: cuName.trim(),
        password:     cuPassword,
        role:         cuRole,
      },
    })

    // Los errores de la función vienen en data.error (status !=2xx también llega como error)
    const errMsg = (data as { error?: string } | null)?.error
      ?? (error ? await extractFnError(error) : null)

    if (errMsg) {
      setCuError(errMsg)
    } else {
      setCuSuccess(`Usuario "${username}" creado. Ya puede iniciar sesión.`)
      setCuName(''); setCuUsername(''); setCuEmail(''); setCuPassword('')
      load()
    }
    setCreating(false)
  }

  const isAdmin = myRole === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-6">

      {/* Lista de miembros */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Miembros ({members.length})
        </h3>
        {loadError && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-2">
            No se pudieron cargar los miembros: {loadError}
          </p>
        )}
        <div className="space-y-2">
          {members.map(m => {
            const isMe = m.user_id === user?.id
            const displayName = m.profile?.display_name ?? 'Usuario'
            const username = m.profile?.username
            return (
              <div key={m.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-600">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {displayName}{isMe ? ' (vos)' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_CHIP[m.role]}`}>
                      {ROLE_LABEL[m.role]}
                    </span>
                    {username && <span className="text-[11px] text-slate-400 truncate">@{username}</span>}
                  </div>
                </div>

                {isAdmin && !isMe && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Cambiar rol */}
                    <div className="relative">
                      <select
                        value={m.role}
                        onChange={e => handleChangeRole(m.id, e.target.value as 'admin' | 'executor' | 'reader')}
                        className="appearance-none text-xs bg-slate-100 text-slate-600 rounded-lg pl-2 pr-6 py-1.5 font-medium cursor-pointer focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="executor">Ejecutor</option>
                        <option value="reader">Lector</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {/* Eliminar */}
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Invitaciones pendientes */}
      {isAdmin && invitations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Invitaciones pendientes
          </h3>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={16} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{inv.email}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_CHIP[inv.role]}`}>
                    {ROLE_LABEL[inv.role]}
                  </span>
                </div>
                <button
                  onClick={() => handleRevokeInvite(inv.id)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de invitación (solo admin) */}
      {isAdmin && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Shield size={12} /> Invitar miembro
          </h3>
          <form onSubmit={handleInvite} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={invEmail}
                onChange={e => { setInvEmail(e.target.value); setInvSuccess(false) }}
                placeholder="correo@ejemplo.com"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Rol</label>
              <div className="grid grid-cols-2 gap-2">
                {(['executor', 'reader'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInvRole(r)}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                      invRole === r
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-100 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {invRole === 'executor'
                  ? 'Puede agregar y editar movimientos.'
                  : 'Solo puede ver los datos de la cartera.'}
              </p>
            </div>

            {invError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{invError}</p>
            )}
            {invSuccess && (
              <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">
                Invitación enviada. La persona podrá aceptarla al iniciar sesión.
              </p>
            )}

            <button
              type="submit"
              disabled={inviting || !invEmail.trim()}
              className="w-full py-3 bg-brand-500 text-white font-bold rounded-2xl disabled:opacity-40 text-sm"
            >
              {inviting ? 'Enviando...' : 'Invitar'}
            </button>
          </form>
        </div>
      )}

      {/* Crear usuario directamente (solo admin) */}
      {isAdmin && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <UserPlus size={12} /> Crear usuario
          </h3>
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nombre</label>
                <input
                  value={cuName}
                  onChange={e => { setCuName(e.target.value); setCuSuccess(null) }}
                  placeholder="Nombre"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Usuario</label>
                <input
                  value={cuUsername}
                  onChange={e => { setCuUsername(e.target.value); setCuSuccess(null) }}
                  placeholder="usuario"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={cuEmail}
                onChange={e => { setCuEmail(e.target.value); setCuSuccess(null) }}
                placeholder="correo@ejemplo.com"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Contraseña temporal</label>
              <input
                type="text"
                value={cuPassword}
                onChange={e => { setCuPassword(e.target.value); setCuSuccess(null) }}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Compartila con la persona; podrá cambiarla luego.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Rol</label>
              <div className="grid grid-cols-2 gap-2">
                {(['executor', 'reader'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCuRole(r)}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                      cuRole === r
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-100 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>

            {cuError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{cuError}</p>
            )}
            {cuSuccess && (
              <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">{cuSuccess}</p>
            )}

            <button
              type="submit"
              disabled={creating || !cuUsername.trim() || !cuEmail.trim() || !cuPassword}
              className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl disabled:opacity-40 text-sm"
            >
              {creating ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
