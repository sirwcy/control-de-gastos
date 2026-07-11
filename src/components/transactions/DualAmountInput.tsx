import { useDataStore } from '../../store/dataStore'
import { toAlt, toOfficial, parseAmount } from '../../lib/formatters'
import type { Currency } from '../../types'

interface Props {
  currency?: Currency  // moneda secundaria de la cuenta (undefined = solo principal)
  valueOfficial: string
  valueAlt: string
  onChangeOfficial: (v: string) => void
  onChangeAlt: (v: string) => void
}

export function DualAmountInput({ currency, valueOfficial, valueAlt, onChangeOfficial, onChangeAlt }: Props) {
  const settings = useDataStore(s => s.settings)
  const { currencySymbol, currencyName } = settings
  const factor = currency?.factor ?? 0

  const handleOfficialChange = (raw: string) => {
    const clean = raw.replace(/[^0-9.,]/g, '')
    onChangeOfficial(clean)
    if (!currency) return
    const num = parseAmount(clean)
    if (!isNaN(num) && num > 0 && factor > 0) {
      onChangeAlt(String(Math.round(toAlt(num, factor) * 100) / 100))
    } else {
      onChangeAlt('')
    }
  }

  const handleAltChange = (raw: string) => {
    const clean = raw.replace(/[^0-9.,]/g, '')
    onChangeAlt(clean)
    const num = parseAmount(clean)
    if (!isNaN(num) && num > 0 && factor > 0) {
      onChangeOfficial(String(Math.round(toOfficial(num, factor) * 100) / 100))
    } else {
      onChangeOfficial('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Moneda principal */}
      <div className="bg-slate-50 rounded-2xl px-4 py-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currencyName}</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-slate-400">{currencySymbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={valueOfficial}
            onChange={e => handleOfficialChange(e.target.value)}
            placeholder="0"
            className="flex-1 text-4xl font-bold text-slate-800 bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Moneda de la cuenta (solo si tiene) */}
      {currency && (
        <>
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] text-slate-400 font-medium">
              1 {currencySymbol} = {currency.factor.toLocaleString('es-AR')} {currency.symbol}
            </span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="bg-amber-50 rounded-2xl px-4 py-4">
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mb-1">{currency.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-amber-300">{currency.symbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={valueAlt}
                onChange={e => handleAltChange(e.target.value)}
                placeholder="0"
                className="flex-1 text-4xl font-bold text-amber-700 bg-transparent outline-none"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
