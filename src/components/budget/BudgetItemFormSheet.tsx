import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { CategoryPicker } from '../categories/CategoryPicker'
import { CurrencyInput } from '../ui/CurrencyInput'
import { useDataStore } from '../../store/dataStore'
import { useUIStore } from '../../store/uiStore'
import type { CategoryRef } from '../../types'
import { getFullPath } from '../../lib/categoryHelpers'
import { parseAmount } from '../../lib/formatters'

interface Props {
  periodId: string
}

export function BudgetItemFormSheet({ periodId }: Props) {
  const { upsertBudgetItem, categories, subcategories, subSubcategories } = useDataStore()
  const { addBudgetItemOpen, closeBudgetItemSheet } = useUIStore()

  const [step, setStep] = useState<'category' | 'amount'>('category')
  const [categoryRef, setCategoryRef] = useState<CategoryRef | null>(null)
  const [amountStr, setAmountStr] = useState('')

  const reset = () => {
    setStep('category')
    setCategoryRef(null)
    setAmountStr('')
  }

  const handleClose = () => {
    reset()
    closeBudgetItemSheet()
  }

  const handleCategorySelect = (ref: CategoryRef) => {
    setCategoryRef(ref)
    setStep('amount')
  }

  const handleSave = () => {
    if (!categoryRef || !amountStr) return
    const amount = parseAmount(amountStr)
    if (isNaN(amount) || amount <= 0) return
    upsertBudgetItem(periodId, categoryRef, amount)
    handleClose()
  }

  const fullPath = categoryRef
    ? getFullPath(categoryRef, categories, subcategories, subSubcategories)
    : ''

  return (
    <BottomSheet
      open={addBudgetItemOpen}
      onClose={handleClose}
      title={step === 'category' ? 'Seleccionar categoría' : 'Asignar monto'}
      fullHeight
    >
      {step === 'category' ? (
        <CategoryPicker value={categoryRef} onChange={handleCategorySelect} />
      ) : (
        <div className="p-5 space-y-5">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Categoría</p>
            <p className="text-sm font-semibold text-slate-700">{fullPath}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Monto presupuestado</label>
            <div className="bg-slate-50 rounded-2xl px-4 py-4">
              <CurrencyInput value={amountStr} onChange={setAmountStr} large />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('category')}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm"
            >
              Atrás
            </button>
            <button
              onClick={handleSave}
              disabled={!amountStr}
              className="flex-1 py-3 rounded-2xl bg-brand-500 text-white font-semibold text-sm disabled:opacity-40"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
