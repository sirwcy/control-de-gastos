import { useDataStore } from '../../store/dataStore'
import { toAlt, toOfficial, parseAmount } from '../../lib/formatters'

interface Props {
  valueOfficial: string
  valueAlt: string
  onChangeOfficial: (v: string) => void
  onChangeAlt: (v: string) => void
}

export function DualAmountInput({ valueOfficial, valueAlt, onChangeOfficial, onChangeAlt }: Props) {
  const settings = useDataStore(s => s.settings)
  const { currencySymbol, altCurrencySymbol, conversionFactor, currencyName, altCurrencyName } = settings

  const handleOfficialChange = (raw: string) => {
    const clean = raw.replace(/[^0-9.,]/g, '')
    onChangeOfficial(clean)
    const num = parseAmount(clean)
    if (!isNaN(num) && num > 0) {
      onChangeAlt(String(Math.round(toAlt(num, conversionFactor) * 100) / 100))
    } else {
      onChangeAlt('')
    }
  }

  const handleAltChange = (raw: string) => {
    const clean = raw.replace(/[^0-9.,]/g, '')
    onChangeAlt(clean)
    const num = parseAmount(clean)
    if (!isNaN(num) && num > 0) {
      onChangeOfficial(String(Math.round(toOfficial(num, conversionFactor) * 100) / 100))
    } else {
      onChangeOfficial('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Moneda oficial */}
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

      {/* Separador con factor de conversión */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] text-slate-400 font-medium">
          1 {altCurrencySymbol} = {currencySymbol}{conversionFactor.toLocaleString('es-AR')}
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Moneda alterna */}
      <div className="bg-amber-50 rounded-2xl px-4 py-4">
        <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mb-1">{altCurrencyName}</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-amber-300">{altCurrencySymbol}</span>
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
    </div>
  )
}
