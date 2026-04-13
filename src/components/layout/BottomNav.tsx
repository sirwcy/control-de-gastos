import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Wallet, PieChart, Plus, ShoppingCart } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'

const tabs = [
  { to: '/',             icon: LayoutDashboard, label: 'Inicio'      },
  { to: '/movimientos',  icon: ArrowLeftRight,  label: 'Movimientos' },
  { to: '/cuentas',      icon: Wallet,          label: 'Cuentas'     },
  { to: '/compras',      icon: ShoppingCart,    label: 'Compras'     },
  { to: '/presupuesto',  icon: PieChart,        label: 'Presupuesto' },
]

export function BottomNav() {
  const openAddTransaction = useUIStore(s => s.openAddTransaction)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 safe-bottom">
      <div className="flex items-end h-16 max-w-md mx-auto px-1">
        {tabs.slice(0, 2).map(tab => <NavItem key={tab.to} {...tab} />)}

        <div className="flex flex-col items-center flex-1 -mt-5">
          <button
            onClick={() => openAddTransaction('expense')}
            className="w-14 h-14 rounded-full bg-brand-500 shadow-lg shadow-brand-500/40 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </button>
          <span className="text-[10px] text-slate-400 mt-0.5">Agregar</span>
        </div>

        {tabs.slice(2).map(tab => <NavItem key={tab.to} {...tab} />)}
      </div>
    </nav>
  )
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn('flex flex-col items-center justify-end pb-2 flex-1 gap-0.5 transition-colors', isActive ? 'text-brand-600' : 'text-slate-400')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
          <span className={cn('text-[10px] font-medium leading-tight text-center', isActive ? 'text-brand-600' : 'text-slate-400')}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
