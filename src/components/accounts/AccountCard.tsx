import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import type { Account } from '../../types'
import { useDataStore } from '../../store/dataStore'
import { formatCurrencyFull, formatCurrencyAlt } from '../../lib/formatters'
import { CategoryIcon } from '../categories/CategoryIcon'
import { ACCOUNT_TYPE_LABELS } from '../../lib/constants'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { AccountFormSheet } from './AccountFormSheet'

interface Props {
  account: Account
}

export function AccountCard({ account }: Props) {
  const { getAccountBalance, deleteAccount, settings } = useDataStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const balanceData = getAccountBalance(account.id)
  const balance    = balanceData?.balance ?? account.initialBalance
  const balanceAlt = balanceData?.balanceAlt ?? account.initialBalanceAlt
  const isNegative = balance < 0

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <CategoryIcon name={account.icon} color={account.color} size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{account.name}</p>
              <p className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            </div>
            <button onClick={() => setMenuOpen(m => !m)} className="text-slate-300 p-1">
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Saldos */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">{settings.currencyName}</p>
              <p className={`text-2xl font-bold ${isNegative ? 'text-red-500' : 'text-slate-800'}`}>
                {formatCurrencyFull(balance, settings)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-400 mb-0.5">{settings.altCurrencyName}</p>
              <p className={`text-base font-semibold ${balanceAlt < 0 ? 'text-red-400' : 'text-amber-600'}`}>
                {formatCurrencyAlt(balanceAlt, settings)}
              </p>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-50 px-4 py-2 flex gap-4 bg-slate-50">
            <button onClick={() => { setEditing(true); setMenuOpen(false) }} className="text-xs text-brand-600 font-medium py-1">Editar</button>
            <button onClick={() => { setDeleting(true); setMenuOpen(false) }} className="text-xs text-red-500 font-medium py-1">Eliminar</button>
          </div>
        )}
      </div>

      <AccountFormSheet open={editing} onClose={() => setEditing(false)} editing={account} />

      <ConfirmDialog
        open={deleting}
        title="¿Eliminar cuenta?"
        message={`Se eliminará "${account.name}". Los movimientos asociados quedarán sin cuenta asignada.`}
        onConfirm={() => { deleteAccount(account.id); setDeleting(false) }}
        onCancel={() => setDeleting(false)}
      />
    </>
  )
}
