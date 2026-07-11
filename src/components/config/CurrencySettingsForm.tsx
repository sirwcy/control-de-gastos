import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check, ExternalLink, RefreshCw, History, ChevronDown } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import { parseAmount, formatDate } from '../../lib/formatters'
import type { Currency } from '../../types'

// ─── Moneda principal ─────────────────────────────────────────────────────────
function PrimaryCurrencyForm() {
  const { settings, updateSettings } = useDataStore()
  const [form, setForm] = useState({
    currencySymbol: settings.currencySymbol,
    currencyCode:   settings.currencyCode,
    currencyName:   settings.currencyName,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({
      currencySymbol: settings.currencySymbol,
      currencyCode:   settings.currencyCode,
      currencyName:   settings.currencyName,
    })
  }, [settings.currencySymbol, settings.currencyCode, settings.currencyName])

  const handleSave = () => {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Moneda principal</h3>
      <p className="text-xs text-slate-400 mb-3">Es la base de todos los cálculos y del presupuesto.</p>
      <div className="space-y-2">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Símbolo</label>
            <input
              value={form.currencySymbol}
              onChange={e => setForm(f => ({ ...f, currencySymbol: e.target.value }))}
              placeholder="$"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Código</label>
            <input
              value={form.currencyCode}
              onChange={e => setForm(f => ({ ...f, currencyCode: e.target.value }))}
              placeholder="ARS"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
          <input
            value={form.currencyName}
            onChange={e => setForm(f => ({ ...f, currencyName: e.target.value }))}
            placeholder="Peso Argentino"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        className={`w-full mt-3 py-3 font-semibold rounded-2xl text-sm transition-colors ${
          saved ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white'
        }`}
      >
        {saved ? 'Guardado' : 'Guardar moneda principal'}
      </button>
    </div>
  )
}

// ─── Formulario de moneda secundaria (crear / editar) ─────────────────────────
interface DraftFormProps {
  initial?: { code: string; symbol: string; name: string; factor: string; sourceUrl: string }
  primarySymbol: string
  onSubmit: (data: { code: string; symbol: string; name: string; factor: number; sourceUrl: string }) => void
  onCancel?: () => void
  submitLabel: string
}

function CurrencyDraftForm({ initial, primarySymbol, onSubmit, onCancel, submitLabel }: DraftFormProps) {
  const [code,   setCode]   = useState(initial?.code   ?? '')
  const [symbol, setSymbol] = useState(initial?.symbol ?? '')
  const [name,   setName]   = useState(initial?.name   ?? '')
  const [factorStr, setFactorStr] = useState(initial?.factor ?? '')
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? '')

  const factor = parseAmount(factorStr)
  const valid = !!code.trim() && !!symbol.trim() && !!name.trim() && !isNaN(factor) && factor > 0

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex gap-2">
        <div className="w-20">
          <label className="text-xs text-slate-400 mb-1 block">Símbolo</label>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="U$S"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>
        <div className="w-24">
          <label className="text-xs text-slate-400 mb-1 block">Código</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="USD"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Dólar"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Factor de conversión</label>
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5">
          <span className="text-sm text-slate-400 whitespace-nowrap">1 {primarySymbol} =</span>
          <input
            type="text"
            inputMode="decimal"
            value={factorStr}
            onChange={e => setFactorStr(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="7"
            className="flex-1 text-sm font-bold text-slate-800 outline-none bg-transparent"
          />
          <span className="text-sm text-slate-400 whitespace-nowrap">{symbol || '?'}</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Fuente / página de referencia (opcional)</label>
        <input
          value={sourceUrl}
          onChange={e => setSourceUrl(e.target.value)}
          placeholder="https://www.bcv.org.ve/"
          inputMode="url"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500"
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-1"
          >
            <X size={15} /> Cancelar
          </button>
        )}
        <button
          onClick={() => onSubmit({ code: code.trim(), symbol: symbol.trim(), name: name.trim(), factor, sourceUrl: sourceUrl.trim() })}
          disabled={!valid}
          className="flex-[2] py-2.5 bg-brand-500 text-white font-semibold rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Check size={15} /> {submitLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Fila de moneda secundaria ────────────────────────────────────────────────
function CurrencyRow({ currency, primarySymbol }: { currency: Currency; primarySymbol: string }) {
  const { updateCurrency, deleteCurrency, refreshBcvRates, getRatesForCurrency } = useDataStore()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const isBcv = !!currency.sourceUrl && /bcv\.org\.ve/i.test(currency.sourceUrl)
  const rates = getRatesForCurrency(currency.id)

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    const r = await refreshBcvRates()
    if (r.error) setError(r.error)
    setRefreshing(false)
  }

  if (editing) {
    return (
      <CurrencyDraftForm
        initial={{ code: currency.code, symbol: currency.symbol, name: currency.name, factor: String(currency.factor), sourceUrl: currency.sourceUrl ?? '' }}
        primarySymbol={primarySymbol}
        submitLabel="Guardar"
        onCancel={() => setEditing(false)}
        onSubmit={async (data) => { await updateCurrency(currency.id, data); setEditing(false) }}
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-amber-600">{currency.symbol}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{currency.name} <span className="text-slate-400 font-normal">· {currency.code}</span></p>
          <p className="text-xs text-slate-400">1 {primarySymbol} = {currency.factor.toLocaleString('es-AR')} {currency.symbol}</p>
          {currency.sourceUrl && (
            <a
              href={currency.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] text-brand-600 font-medium mt-0.5"
            >
              <ExternalLink size={11} /> Ver fuente
            </a>
          )}
          {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
        </div>
        <button onClick={() => { setError(null); setEditing(true) }} className="p-1.5 text-brand-500 hover:bg-brand-50 rounded-lg flex-shrink-0">
          <Pencil size={15} />
        </button>
        <button
          onClick={async () => { const r = await deleteCurrency(currency.id); if (r.error) setError(r.error) }}
          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Consulta automática BCV: actualizar tasa + histórico */}
      {isBcv && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Actualizando...' : 'Actualizar tasa (BCV)'}
            </button>
            {rates.length > 0 && (
              <button
                onClick={() => setShowHistory(h => !h)}
                className="flex items-center gap-1 text-xs font-medium text-slate-400 px-2 py-1.5"
              >
                <History size={13} /> Histórico ({rates.length})
                <ChevronDown size={13} className={showHistory ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            )}
          </div>

          {showHistory && rates.length > 0 && (
            <div className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-slate-50 divide-y divide-slate-100">
              {rates.map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="text-slate-500">{formatDate(r.rateDate)}</span>
                  <span className="font-semibold text-slate-700">
                    {r.rate.toLocaleString('es-AR')} {currency.symbol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function CurrencySettingsForm() {
  const { settings, currencies, addCurrency } = useDataStore()
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-6">
      <PrimaryCurrencyForm />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Otras monedas</h3>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1.5 rounded-lg"
            >
              <Plus size={14} /> Agregar
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Monedas para asignar a tus cuentas. El factor indica cuántas unidades de esa moneda
          equivale 1 unidad de la principal.
        </p>

        <div className="space-y-2">
          {currencies.map(c => (
            <CurrencyRow key={c.id} currency={c} primarySymbol={settings.currencySymbol} />
          ))}

          {adding && (
            <CurrencyDraftForm
              primarySymbol={settings.currencySymbol}
              submitLabel="Crear moneda"
              onCancel={() => setAdding(false)}
              onSubmit={async (data) => { await addCurrency(data); setAdding(false) }}
            />
          )}

          {currencies.length === 0 && !adding && (
            <p className="text-sm text-slate-400 text-center py-4">
              No hay monedas secundarias. Agregá una para usarla en tus cuentas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
