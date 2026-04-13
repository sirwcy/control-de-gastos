import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingDown, Eye, EyeOff, MailCheck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function RegisterPage() {
  const { signUp } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [confirmed, setConfirmed]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setError(null)
    setLoading(true)
    const { error, needsConfirmation } = await signUp(email.trim(), password, displayName.trim())
    setLoading(false)
    if (error) { setError(error); return }
    if (needsConfirmation) setConfirmed(true)
    // Si no necesita confirmación, el onAuthStateChange del authStore se encarga
  }

  if (confirmed) {
    return (
      <div className="min-h-svh bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <MailCheck size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Revisá tu email</h2>
          <p className="text-sm text-slate-500">
            Te enviamos un link de confirmación a <span className="font-semibold text-slate-700">{email}</span>.
            Hacé clic en el link para activar tu cuenta.
          </p>
          <Link
            to="/login"
            className="block w-full py-3 bg-brand-500 text-white font-semibold rounded-2xl text-sm"
          >
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-200">
          <TrendingDown size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Control de Gastos</h1>
          <p className="text-sm text-slate-400 mt-0.5">Tu dinero, bajo control</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-bold text-slate-800">Crear cuenta</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nombre</label>
            <input
              type="text"
              autoComplete="name"
              autoFocus
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || !displayName}
            className="w-full py-3.5 bg-brand-500 text-white font-bold rounded-2xl disabled:opacity-40 text-sm"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand-600 font-semibold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
