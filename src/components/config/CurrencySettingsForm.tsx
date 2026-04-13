import { useState, useEffect } from 'react'
import { useDataStore } from '../../store/dataStore'
import { parseAmount } from '../../lib/formatters'

export function CurrencySettingsForm() {
  const { settings, updateSettings } = useDataStore()
  const [form, setForm] = useState({ ...settings })
  const [factorStr, setFactorStr] = useState(String(settings.conversionFactor))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({ ...settings })
    setFactorStr(String(settings.conversionFactor))
  }, [settings])

  const field = (key: keyof typeof form) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const handleSave = () => {
    const conversionFactor = parseAmount(factorStr)
    if (isNaN(conversionFactor) || conversionFactor <= 0) return
    updateSettings({ ...form, conversionFactor })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Moneda oficial</h3>
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Símbolo</label>
              <input
                {...field('currencySymbol')}
                placeholder="$"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Código</label>
              <input
                {...field('currencyCode')}
                placeholder="ARS"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
            <input
              {...field('currencyName')}
              placeholder="Peso Argentino"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Moneda alterna</h3>
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Símbolo</label>
              <input
                {...field('altCurrencySymbol')}
                placeholder="U$S"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Código</label>
              <input
                {...field('altCurrencyCode')}
                placeholder="USD"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
            <input
              {...field('altCurrencyName')}
              placeholder="Dólar"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Factor de conversión</h3>
        <p className="text-xs text-slate-400 mb-3">
          Cuántas unidades de moneda oficial equivalen a 1 unidad alterna.
          <br />Ej: si U$S 1 = $1.000, ingresá <strong>1000</strong>.
        </p>
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3">
          <span className="text-sm text-slate-400">1 {form.altCurrencySymbol} =</span>
          <input
            type="text"
            inputMode="decimal"
            value={factorStr}
            onChange={e => setFactorStr(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="1000"
            className="flex-1 text-sm font-bold text-slate-800 outline-none bg-transparent"
          />
          <span className="text-sm text-slate-400">{form.currencySymbol}</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-3.5 font-semibold rounded-2xl transition-colors ${
          saved ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white'
        }`}
      >
        {saved ? 'Guardado' : 'Guardar configuración'}
      </button>
    </div>
  )
}
