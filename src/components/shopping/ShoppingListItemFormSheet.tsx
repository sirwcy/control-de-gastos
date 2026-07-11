import { useState, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { CategoryPicker } from '../categories/CategoryPicker'
import { DualAmountInput } from '../transactions/DualAmountInput'
import { useDataStore } from '../../store/dataStore'
import type { ShoppingListItem, CategoryRef, Subcategory, SubSubcategory } from '../../types'
import { getFullPath } from '../../lib/categoryHelpers'
import { parseAmount } from '../../lib/formatters'

function hasDeepChildren(ref: CategoryRef, subs: Subcategory[], subSubs: SubSubcategory[]): boolean {
  if (ref.level === 'category')    return subs.some(s => s.categoryId === ref.categoryId)
  if (ref.level === 'subcategory') return subSubs.some(ss => ss.subcategoryId === ref.subcategoryId)
  return false
}

interface Props {
  open: boolean
  onClose: () => void
  listId: string
  editing?: ShoppingListItem
}

type Step = 'details' | 'category'

export function ShoppingListItemFormSheet({ open, onClose, listId, editing }: Props) {
  const { addShoppingListItem, updateShoppingListItem, currencies, categories, subcategories, subSubcategories } = useDataStore()
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [categoryRef, setCategoryRef] = useState<CategoryRef | null>(null)
  const [amountStr, setAmountStr] = useState('')
  const [amountAltStr, setAmountAltStr] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('details')
    setName(editing?.name ?? '')
    setCategoryRef(editing?.categoryRef ?? null)
    setAmountStr(editing ? String(editing.estimatedAmount) : '')
    setAmountAltStr(editing ? String(editing.estimatedAmountAlt) : '')
    setNotes(editing?.notes ?? '')
  }, [open, editing])

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const estimatedAmount    = parseAmount(amountStr) || 0
    const estimatedAmountAlt = parseAmount(amountAltStr) || 0
    if (editing) {
      updateShoppingListItem(editing.id, {
        name: trimmed, categoryRef: categoryRef ?? undefined,
        estimatedAmount, estimatedAmountAlt, notes: notes.trim() || undefined,
      })
    } else {
      addShoppingListItem({
        listId, name: trimmed, categoryRef: categoryRef ?? undefined,
        estimatedAmount, estimatedAmountAlt, notes: notes.trim() || undefined,
      })
    }
    onClose()
  }

  const fullPath = categoryRef
    ? getFullPath(categoryRef, categories, subcategories, subSubcategories)
    : ''

  if (step === 'category') {
    return (
      <BottomSheet open={open} onClose={onClose} title="Categoría" fullHeight>
        <div className="px-5 pt-3 pb-2 flex justify-between items-center">
          <button onClick={() => setStep('details')} className="text-xs text-brand-600 font-medium">← Volver</button>
          <button onClick={() => { setCategoryRef(null); setStep('details') }} className="text-xs text-slate-400">Sin categoría</button>
        </div>
        <CategoryPicker
          value={categoryRef}
          onChange={ref => {
            setCategoryRef(ref)
            // Quedarse si todavía hay un nivel más para seleccionar
            if (!hasDeepChildren(ref, subcategories, subSubcategories)) {
              setStep('details')
            }
          }}
        />
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? 'Editar ítem' : 'Nuevo ítem'} fullHeight>
      <div className="p-5 space-y-4">
        {/* Nombre */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nombre del ítem</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej: Leche, Pan, Jabón..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Categoría</label>
          <button
            onClick={() => setStep('category')}
            className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 text-sm text-left"
          >
            <span className={fullPath ? 'text-slate-800' : 'text-slate-400'}>
              {fullPath || 'Sin categoría (opcional)'}
            </span>
            <span className="text-slate-300 text-xs">›</span>
          </button>
        </div>

        {/* Monto estimado */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Monto estimado</label>
          <DualAmountInput
            currency={currencies[0]}
            valueOfficial={amountStr}
            valueAlt={amountAltStr}
            onChangeOfficial={setAmountStr}
            onChangeAlt={setAmountAltStr}
          />
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Notas (opcional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="ej: Marca X, sin sal..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-2xl disabled:opacity-40"
        >
          {editing ? 'Guardar cambios' : 'Agregar ítem'}
        </button>
      </div>
    </BottomSheet>
  )
}
