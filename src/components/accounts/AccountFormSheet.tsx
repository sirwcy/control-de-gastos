import { useState, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { CategoryIcon } from '../categories/CategoryIcon'
import { useDataStore } from '../../store/dataStore'
import type { Account, AccountType } from '../../types'
import { CATEGORY_COLORS, ACCOUNT_ICONS, ACCOUNT_TYPE_LABELS } from '../../lib/constants'
import { parseAmount, toAlt, toOfficial } from '../../lib/formatters'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Account
}

export function AccountFormSheet({ open, onClose, editing }: Props) {
  const { addAccount, updateAccount, currencies, settings } = useDataStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [color, setColor] = useState(CATEGORY_COLORS[3])
  const [icon, setIcon] = useState(ACCOUNT_ICONS[0])
  const [balanceStr, setBalanceStr] = useState('')
  const [balanceAltStr, setBalanceAltStr] = useState('')
  const [currencyId, setCurrencyId] = useState('')          // '' = principal (preferencial)
  const [displayIds, setDisplayIds] = useState<string[]>([]) // secundarias adicionales
  const [showPrimary, setShowPrimary] = useState(false)      // mostrar principal como adicional

  const currency = currencies.find(c => c.id === currencyId)
  const factor = currency?.factor ?? 0

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setType(editing?.type ?? 'cash')
      setColor(editing?.color ?? CATEGORY_COLORS[3])
      setIcon(editing?.icon ?? ACCOUNT_ICONS[0])
      setBalanceStr(editing ? String(editing.initialBalance) : '')
      setBalanceAltStr(editing ? String(editing.initialBalanceAlt) : '')
      setCurrencyId(editing?.currencyId ?? '')
      setDisplayIds(editing?.displayCurrencyIds ?? [])
      setShowPrimary(editing?.showPrimary ?? false)
    }
  }, [open, editing])

  const toggleDisplayId = (id: string) =>
    setDisplayIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])

  const handleBalanceChange = (v: string) => {
    const clean = v.replace(/[^0-9.,]/g, '')
    setBalanceStr(clean)
    const num = parseAmount(clean)
    if (!isNaN(num) && factor > 0) setBalanceAltStr(String(Math.round(toAlt(num, factor) * 100) / 100))
  }

  const handleBalanceAltChange = (v: string) => {
    const clean = v.replace(/[^0-9.,]/g, '')
    setBalanceAltStr(clean)
    const num = parseAmount(clean)
    if (!isNaN(num) && factor > 0) setBalanceStr(String(Math.round(toOfficial(num, factor) * 100) / 100))
  }

  // Al cambiar la preferencial, recalcular el saldo y evitar duplicarla en adicionales
  const handleCurrencyChange = (id: string) => {
    setCurrencyId(id)
    setDisplayIds(ids => ids.filter(x => x !== id))
    if (id) setShowPrimary(false) // si la preferencial es secundaria, la principal se controla por su check
    const cur = currencies.find(c => c.id === id)
    const num = parseAmount(balanceStr)
    if (cur && !isNaN(num)) {
      setBalanceAltStr(String(Math.round(toAlt(num, cur.factor) * 100) / 100))
    } else {
      setBalanceAltStr('')
    }
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const initialBalance = parseAmount(balanceStr) || 0
    const initialBalanceAlt = currencyId ? (parseAmount(balanceAltStr) || 0) : 0
    const data = {
      name: trimmed, type, color, icon,
      initialBalance, initialBalanceAlt,
      currencyId: currencyId || undefined,
      displayCurrencyIds: displayIds,
      // Si la preferencial ya es la principal, no tiene sentido "mostrar principal" aparte
      showPrimary: currencyId ? showPrimary : false,
    }
    if (editing) {
      updateAccount(editing.id, data)
    } else {
      addAccount(data)
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

        {/* Moneda preferencial (titular de la ficha) */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Moneda preferencial (titular)</label>
          <select
            value={currencyId}
            onChange={e => handleCurrencyChange(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500 bg-white"
          >
            <option value="">{settings.currencyName} (principal)</option>
            {currencies.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Es la moneda que encabeza la ficha. Se muestra la equivalencia del saldo en esta moneda.
          </p>
        </div>

        {/* Monedas adicionales a mostrar en la ficha */}
        {(currencies.length > 0 || currencyId) && (
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">
              Mostrar también en la ficha
            </label>
            <div className="space-y-1.5">
              {/* Principal como adicional (solo si la preferencial es secundaria) */}
              {currencyId && (
                <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 rounded-xl px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={showPrimary}
                    onChange={e => setShowPrimary(e.target.checked)}
                    className="w-4 h-4 accent-brand-500 flex-shrink-0"
                  />
                  <span className="text-sm text-slate-600">{settings.currencyName} <span className="text-slate-400">(principal)</span></span>
                </label>
              )}
              {/* Otras secundarias, excepto la preferencial */}
              {currencies.filter(c => c.id !== currencyId).map(c => (
                <label key={c.id} className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 rounded-xl px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={displayIds.includes(c.id)}
                    onChange={() => toggleDisplayId(c.id)}
                    className="w-4 h-4 accent-brand-500 flex-shrink-0"
                  />
                  <span className="text-sm text-slate-600">{c.name} <span className="text-slate-400">({c.symbol})</span></span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Se muestran como equivalencias del mismo saldo, según el factor de cada moneda.
            </p>
          </div>
        )}

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
            {currency && (
              <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
                <span className="text-sm text-amber-500 font-medium w-8">{currency.symbol}</span>
                <input
                  type="text" inputMode="decimal" value={balanceAltStr}
                  onChange={e => handleBalanceAltChange(e.target.value)}
                  placeholder="0"
                  className="flex-1 text-sm text-amber-700 outline-none bg-transparent"
                />
              </div>
            )}
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
