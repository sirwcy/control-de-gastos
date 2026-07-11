import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingDown, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function LoginPage() {
  const { signIn } = useAuthStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(identifier.trim(), password)
    if (error) setError(error)
    setLoading(false)
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
        <h2 className="text-lg font-bold text-slate-800">Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Usuario o email</label>
            <input
              type="text"
              autoComplete="username"
              autoFocus
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="usuario o tu@email.com"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
            disabled={loading || !identifier || !password}
            className="w-full py-3.5 bg-brand-500 text-white font-bold rounded-2xl disabled:opacity-40 text-sm"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-brand-600 font-semibold">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
