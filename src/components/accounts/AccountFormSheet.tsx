import { useState, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { CategoryIcon } from '../categories/CategoryIcon'
import { useDataStore } from '../../store/dataStore'
import type { Account, AccountType } from '../../types'
import { CATEGORY_COLORS, ACCOUNT_ICONS, ACCOUNT_TYPE_LABELS } from '../../lib/constants'
import { parseAmount, toAlt } from '../../lib/formatters'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Account
}

export function AccountFormSheet({ open, onClose, editing }: Props) {
  const { addAccount, updateAccount, settings } = useDataStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [color, setColor] = useState(CATEGORY_COLORS[3])
  const [icon, setIcon] = useState(ACCOUNT_ICONS[0])
  const [balanceStr, setBalanceStr] = useState('')
  const [balanceAltStr, setBalanceAltStr] = useState('')

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setType(editing?.type ?? 'cash')
      setColor(editing?.color ?? CATEGORY_COLORS[3])
      setIcon(editing?.icon ?? ACCOUNT_ICONS[0])
      setBalanceStr(editing ? String(editing.initialBalance) : '')
      setBalanceAltStr(editing ? String(editing.initialBalanceAlt) : '')
    }
  }, [open, editing])

  const handleBalanceChange = (v: string) => {
    const clean = v.replace(/[^0-9.,]/g, '')
    setBalanceStr(clean)
    const num = parseAmount(clean)
    if (!isNaN(num)) setBalanceAltStr(String(Math.round(toAlt(num, settings.conversionFactor) * 100) / 100))
  }

  const handleBalanceAltChange = (v: string) => {
    const clean = v.replace(/[^0-9.,]/g, '')
    setBalanceAltStr(clean)
    const num = parseAmount(clean)
    if (!isNaN(num)) setBalanceStr(String(Math.round(num * settings.conversionFactor * 100) / 100))
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const initialBalance = parseAmount(balanceStr) || 0
    const initialBalanceAlt = parseAmount(balanceAltStr) || 0
    if (editing) {
      updateAccount(editing.id, { name: trimmed, type, color, icon, initialBalance, initialBalanceAlt })
    } else {
      addAccount({ name: trimmed, type, color, icon, initialBalance, initialBalanceAlt })
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? 'Editar cuenta' : 'Nueva cuenta'} fullHeight>
      <div className="p-5 space-y-5">
        {/* Preview */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
          <CategoryIcon name={icon} color={color} size={20} />
          <div>
            <p className="font-semibold text-slate-700">{name || 'Sin nombre'}</p>
            <p className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[type]}</p>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nombre</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej: Efectivo, Cuenta Banco..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Tipo de cuenta</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2 rounded-xl text-xs font-medium transition-colors ${type === t ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ backgroundColor: c }}
              >
                {color === c && <span className="text-white text-base">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Ícono */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Ícono</label>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`p-2 rounded-xl transition-colors ${icon === ic ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-slate-100'}`}
              >
                <CategoryIcon name={ic} color={icon === ic ? color : '#94a3b8'} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Saldo inicial */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Saldo inicial</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-sm text-slate-400 font-medium w-8">{settings.currencySymbol}</span>
              <input
                type="text" inputMode="decimal" value={balanceStr}
                onChange={e => handleBalanceChange(e.target.value)}
                placeholder="0"
                className="flex-1 text-sm text-slate-800 outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
              <span className="text-sm text-amber-500 font-medium w-8">{settings.altCurrencySymbol}</span>
              <input
                type="text" inputMode="decimal" value={balanceAltStr}
                onChange={e => handleBalanceAltChange(e.target.value)}
                placeholder="0"
                className="flex-1 text-sm text-amber-700 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-2xl disabled:opacity-40"
        >
          {editing ? 'Guardar cambios' : 'Crear cuenta'}
        </button>
      </div>
    </BottomSheet>
  )
}
