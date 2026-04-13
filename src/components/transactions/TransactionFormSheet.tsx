import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Camera, X } from 'lucide-react'
import { saveImage, getImageUrl, deleteImage } from '../../lib/imageStore'
import { BottomSheet } from '../ui/BottomSheet'
import { CategoryPicker } from '../categories/CategoryPicker'
import { DualAmountInput } from './DualAmountInput'
import { useDataStore } from '../../store/dataStore'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import type { CategoryRef, TransactionType } from '../../types'
import { getFullPath } from '../../lib/categoryHelpers'
import { todayISO, parseAmount } from '../../lib/formatters'

type Step = 'type-account' | 'amount' | 'category' | 'details'

export function TransactionFormSheet() {
  const {
    addTransaction, updateTransaction, transactions,
    accounts, categories, subcategories, subSubcategories, budgetPeriods,
  } = useDataStore()
  const { transactionSheetOpen, editTransactionId, defaultTransactionType, closeTransactionSheet } = useUIStore()
  const { currentWalletId } = useAuthStore()

  const editing = editTransactionId ? transactions.find(t => t.id === editTransactionId) : null

  const [step, setStep]             = useState<Step>('type-account')
  const [txType, setTxType]         = useState<TransactionType>(defaultTransactionType)
  const [accountId, setAccountId]   = useState('')
  const [amountStr, setAmountStr]   = useState('')
  const [amountAltStr, setAmountAltStr] = useState('')
  const [categoryRef, setCategoryRef] = useState<CategoryRef | null>(null)
  const [description, setDescription] = useState('')
  const [date, setDate]             = useState(todayISO())
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removedExistingImage, setRemovedExistingImage] = useState(false)

  useEffect(() => {
    if (!transactionSheetOpen) {
      setImageFile(null)
      setImagePreview(null)
      setRemovedExistingImage(false)
      return
    }
    if (editing) {
      setTxType(editing.type)
      setAccountId(editing.accountId)
      setAmountStr(String(editing.amount))
      setAmountAltStr(String(editing.amountAlt))
      setCategoryRef(editing.categoryRef ?? null)
      setDescription(editing.description)
      setDate(editing.date)
      setStep('details')
      setImageFile(null)
      setRemovedExistingImage(false)
      if (editing.imageId) {
        getImageUrl(editing.imageId).then(url => { if (url) setImagePreview(url) })
      } else {
        setImagePreview(null)
      }
    } else {
      setTxType(defaultTransactionType)
      setAccountId(accounts[0]?.id ?? '')
      setAmountStr('')
      setAmountAltStr('')
      setCategoryRef(null)
      setDescription('')
      setDate(todayISO())
      setStep('type-account')
      setImageFile(null)
      setImagePreview(null)
      setRemovedExistingImage(false)
    }
  }, [transactionSheetOpen, editing])

  const handleSave = async () => {
    const amount = parseAmount(amountStr)
    const amountAlt = parseAmount(amountAltStr) || 0
    if (!amount) return

    const activePeriod = budgetPeriods.find(p => p.isActive)
    if (!activePeriod) return

    const baseData = {
      type: txType,
      accountId,
      budgetPeriodId: activePeriod.id,
      categoryRef: categoryRef ?? undefined,
      amount,
      amountAlt,
      description: description.trim() || (txType === 'income' ? 'Ingreso' : 'Gasto'),
      date,
    }

    if (editing) {
      let imagePath: string | undefined = editing.imageId
      if (imageFile) {
        // Sube al path canónico del TX (upsert sobreescribe si ya existía)
        imagePath = `${currentWalletId}/${editing.id}`
        await saveImage(imagePath, imageFile)
      } else if (removedExistingImage && imagePath) {
        deleteImage(imagePath)
        imagePath = undefined
      }
      await updateTransaction(editing.id, { ...baseData, imageId: imagePath })
    } else {
      // Crear TX primero para obtener el ID, luego subir imagen
      const tx = await addTransaction(baseData)
      if (imageFile) {
        const imagePath = `${currentWalletId}/${tx.id}`
        await saveImage(imagePath, imageFile)
        await updateTransaction(tx.id, { imageId: imagePath })
      }
    }
    closeTransactionSheet()
  }

  const fullPath = categoryRef
    ? getFullPath(categoryRef, categories, subcategories, subSubcategories)
    : ''

  const canProceedFromAmount = !!amountStr && parseAmount(amountStr) > 0
  const canSave = canProceedFromAmount

  const isIncome = txType === 'income'
  const titles: Record<Step, string> = {
    'type-account': editing ? 'Editar movimiento' : 'Nuevo movimiento',
    amount:   'Monto',
    category: 'Categoría',
    details:  editing ? 'Editar movimiento' : 'Detalles',
  }

  return (
    <BottomSheet open={transactionSheetOpen} onClose={closeTransactionSheet} title={titles[step]} fullHeight>

      {/* ─── Paso 1: Tipo + Cuenta ─────────────────────────────────────────────── */}
      {step === 'type-account' && (
        <div className="p-5 space-y-5">
          {/* Tipo de movimiento */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Tipo de movimiento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTxType('expense')}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors ${
                  txType === 'expense'
                    ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <TrendingDown size={18} /> Gasto
              </button>
              <button
                onClick={() => setTxType('income')}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors ${
                  txType === 'income'
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <TrendingUp size={18} /> Ingreso
              </button>
            </div>
          </div>

          {/* Cuenta */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Cuenta</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay cuentas. Creá una desde la sección Cuentas.
              </p>
            ) : (
              <div className="space-y-2">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setAccountId(acc.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                      accountId === acc.id
                        ? 'bg-brand-50 ring-2 ring-brand-500'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: acc.color }} />
                    <span className="text-sm font-medium text-slate-800 flex-1">{acc.name}</span>
                    {accountId === acc.id && (
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setStep('amount')}
            disabled={!accountId}
            className="w-full py-4 bg-brand-500 text-white font-bold text-base rounded-2xl disabled:opacity-30"
          >
            Continuar
          </button>
        </div>
      )}

      {/* ─── Paso 2: Monto ─────────────────────────────────────────────────────── */}
      {step === 'amount' && (
        <div className="p-5 space-y-5">
          <DualAmountInput
            valueOfficial={amountStr}
            valueAlt={amountAltStr}
            onChangeOfficial={setAmountStr}
            onChangeAlt={setAmountAltStr}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setStep('type-account')}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-semibold rounded-2xl text-sm"
            >
              Atrás
            </button>
            <button
              onClick={() => isIncome ? setStep('details') : setStep('category')}
              disabled={!canProceedFromAmount}
              className="flex-[2] py-3.5 bg-brand-500 text-white font-bold rounded-2xl disabled:opacity-30"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ─── Paso 3: Categoría (solo gastos) ───────────────────────────────────── */}
      {step === 'category' && (
        <div>
          <div className="px-5 pt-3 pb-2">
            <button
              onClick={() => setStep('details')}
              className="text-xs text-slate-400 font-medium"
            >
              Omitir categoría →
            </button>
          </div>
          <CategoryPicker
            value={categoryRef}
            onChange={(ref) => { setCategoryRef(ref); setStep('details') }}
          />
        </div>
      )}

      {/* ─── Paso 4: Detalles ──────────────────────────────────────────────────── */}
      {step === 'details' && (
        <div className="p-5 space-y-4">
          {/* Resumen editable */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {isIncome
                ? <TrendingUp size={16} className="text-emerald-600" />
                : <TrendingDown size={16} className="text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <button onClick={() => setStep('amount')} className="text-sm font-bold text-slate-800 text-left">
                {amountStr ? `${isIncome ? '+' : '-'}$${amountStr}` : 'Sin monto'}
              </button>
              <button onClick={() => txType === 'expense' ? setStep('category') : undefined} className="text-xs text-slate-400 truncate block text-left">
                {fullPath || (isIncome ? 'Ingreso' : 'Sin categoría')}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Descripción</label>
            <input
              autoFocus
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isIncome ? 'ej: Sueldo, Venta...' : 'ej: Supermercado, Nafta...'}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>

          {/* Imagen / Comprobante */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Comprobante (opcional)</label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  className="w-full h-40 object-cover rounded-xl border border-slate-200"
                  alt="comprobante"
                />
                <button
                  type="button"
                  onClick={() => {
                    const wasExisting = !imageFile && !!editing?.imageId
                    setImagePreview(null)
                    setImageFile(null)
                    if (wasExisting) setRemovedExistingImage(true)
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              </div>
            ) : (
              <label className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer active:bg-slate-50">
                <Camera size={22} className="text-slate-300" />
                <span className="text-xs text-slate-400">Foto o galería</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setImageFile(file)
                    const reader = new FileReader()
                    reader.onload = () => setImagePreview(reader.result as string)
                    reader.readAsDataURL(file)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-4 font-bold text-base text-white rounded-2xl disabled:opacity-30 ${isIncome ? 'bg-emerald-500' : 'bg-brand-500'}`}
          >
            {editing ? 'Guardar cambios' : (isIncome ? 'Registrar ingreso' : 'Registrar gasto')}
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
