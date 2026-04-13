import { useState, useEffect } from 'react'
import { TrendingDown, ArrowRight } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { DualAmountInput } from '../transactions/DualAmountInput'
import { useDataStore } from '../../store/dataStore'
import type { ShoppingListItem } from '../../types'
import { formatCurrencyFull, parseAmount } from '../../lib/formatters'
import { getFullPath } from '../../lib/categoryHelpers'

interface Props {
  open: boolean
  onClose: () => void
  item: ShoppingListItem | null
}

export function CheckItemSheet({ open, onClose, item }: Props) {
  const { checkShoppingListItem, accounts, settings, categories, subcategories, subSubcategories } = useDataStore()
  const [amountStr, setAmountStr] = useState('')
  const [amountAltStr, setAmountAltStr] = useState('')
  const [accountId, setAccountId] = useState('')

  useEffect(() => {
    if (open && item) {
      setAmountStr(item.estimatedAmount > 0 ? String(item.estimatedAmount) : '')
      setAmountAltStr(item.estimatedAmountAlt > 0 ? String(item.estimatedAmountAlt) : '')
      setAccountId(accounts[0]?.id ?? '')
    }
  }, [open, item, accounts])

  if (!item) return null

  const handleConfirm = () => {
    const amount    = parseAmount(amountStr) || 0
    const amountAlt = parseAmount(amountAltStr) || 0
    checkShoppingListItem(item.id, amount, amountAlt, accountId)
    onClose()
  }

  const actualAmount    = parseAmount(amountStr) || 0
  const estimated       = item.estimatedAmount
  const diff            = actualAmount - estimated
  const hasDiff         = estimated > 0 && actualAmount > 0
  const over            = diff > 0
  const categoryPath    = item.categoryRef
    ? getFullPath(item.categoryRef, categories, subcategories, subSubcategories)
    : null

  return (
    <BottomSheet open={open} onClose={onClose} title="Ejecutar ítem" fullHeight>
      <div className="p-5 space-y-5">
        {/* Nombre e info del ítem */}
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={16} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{item.name}</p>
            {categoryPath && <p className="text-xs text-slate-400 truncate">{categoryPath}</p>}
            {item.notes && <p className="text-xs text-slate-500 mt-0.5 italic">"{item.notes}"</p>}
          </div>
        </div>

        {/* Comparación estimado vs real */}
        {estimated > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="text-center flex-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Estimado</p>
              <p className="text-sm font-bold text-slate-500">{formatCurrencyFull(estimated, settings)}</p>
            </div>
            <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
            <div className="text-center flex-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Real</p>
              <p className={`text-sm font-bold ${hasDiff ? (over ? 'text-red-500' : 'text-emerald-600') : 'text-slate-800'}`}>
                {actualAmount > 0 ? formatCurrencyFull(actualAmount, settings) : '—'}
              </p>
            </div>
            {hasDiff && (
              <div className="text-center flex-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Diferencia</p>
                <p className={`text-sm font-bold ${over ? 'text-red-500' : 'text-emerald-600'}`}>
                  {over ? '+' : ''}{formatCurrencyFull(diff, settings)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Monto real */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Monto real gastado</label>
          <DualAmountInput
            valueOfficial={amountStr}
            valueAlt={amountAltStr}
            onChangeOfficial={setAmountStr}
            onChangeAlt={setAmountAltStr}
          />
        </div>

        {/* Cuenta */}
        {accounts.length > 0 && (
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Debitar de</label>
            <div className="space-y-2">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setAccountId(acc.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                    accountId === acc.id ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-slate-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: acc.color }} />
                  <span className="text-sm font-medium text-slate-800 flex-1">{acc.name}</span>
                  {accountId === acc.id && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!accountId}
          className="w-full py-4 bg-brand-500 text-white font-bold text-base rounded-2xl disabled:opacity-30"
        >
          Registrar gasto
        </button>
      </div>
    </BottomSheet>
  )
}
