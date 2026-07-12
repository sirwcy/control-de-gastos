import { LogOut, Wallet, Users, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

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

export function TopBar() {
  const { user, currentRole, currentWalletName, currentWalletType, signOut, clearCurrentWallet } = useAuthStore()

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Usuario'

  const WalletTypeIcon = currentWalletType === 'family' ? Users : User

  return (
    <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-100">
      {/* Cartera activa (titular) + usuario/rol */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
          <WalletTypeIcon size={16} className="text-brand-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
              {currentWalletName ?? 'Cartera'}
            </p>
            {currentRole && (
              <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_CHIP[currentRole] ?? 'bg-slate-100 text-slate-600'}`}>
                {ROLE_LABEL[currentRole] ?? currentRole}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate leading-tight">
            {displayName}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => clearCurrentWallet()}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100"
        >
          <Wallet size={14} /> Carteras
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100"
        >
          <LogOut size={14} /> Salir
        </button>
      </div>
    </div>
  )
}
