import { useState, useEffect } from 'react'
import { Trash2, Pencil, TrendingUp, TrendingDown, Camera, X, User } from 'lucide-react'
import type { Transaction } from '../../types'
import { getImageUrl } from '../../lib/imageStore'
import { useDataStore } from '../../store/dataStore'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { formatCurrencyFull, formatInCurrency, formatDateShort } from '../../lib/formatters'
import { getFullPath, getCategoryForRef } from '../../lib/categoryHelpers'
import { CategoryIcon } from '../categories/CategoryIcon'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface Props {
  transaction: Transaction
}

export function TransactionCard({ transaction }: Props) {
  const { deleteTransaction, categories, subcategories, subSubcategories, accounts, getCurrency, getMemberName, settings } = useDataStore()
  const { openEditTransaction } = useUIStore()
  const { user, currentRole } = useAuthStore()
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewingImage, setViewingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!viewingImage || !transaction.imageId) return
    getImageUrl(transaction.imageId).then(url => setImageUrl(url))
  }, [viewingImage, transaction.imageId])

  const isIncome = transaction.type === 'income'
  const cat = transaction.categoryRef ? getCategoryForRef(transaction.categoryRef, categories) : undefined
  const fullPath = transaction.categoryRef
    ? getFullPath(transaction.categoryRef, categories, subcategories, subSubcategories)
    : undefined
  const account = accounts.find(a => a.id === transaction.accountId)
  const currency = getCurrency(account?.currencyId)

  // Autor del movimiento
  const isMine = !!transaction.createdBy && transaction.createdBy === user?.id
  const creatorName = isMine ? 'vos' : (getMemberName(transaction.createdBy) ?? 'Desconocido')
  // Permisos: admin edita/borra todo; ejecutor solo lo propio; lector nada
  const canModify = currentRole === 'admin' || (currentRole === 'executor' && isMine)

  return (
    <>
      <div
        className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm active:bg-slate-50 transition-colors"
        onClick={() => setShowActions(s => !s)}
      >
        {/* Ícono de categoría o tipo */}
        <div className="flex-shrink-0">
          {cat ? (
            <CategoryIcon name={cat.icon} color={cat.color} size={18} />
          ) : (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {isIncome
                ? <TrendingUp size={16} className="text-emerald-600" />
                : <TrendingDown size={16} className="text-red-500" />}
            </div>
          )}
        </div>

        {/* Descripción y ruta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {isIncome ? 'Ingreso' : 'Gasto'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">{transaction.description}</p>
          <p className="text-xs text-slate-400 truncate">
            {fullPath ?? (isIncome ? 'Sin categoría' : 'Sin categoría')}
            {account && <span className="text-slate-300"> · {account.name}</span>}
          </p>
        </div>

        {/* Montos y fecha */}
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
            {isIncome ? '+' : '-'}{formatCurrencyFull(transaction.amount, settings)}
          </p>
          {currency && (
            <p className="text-xs text-amber-500">
              {formatInCurrency(transaction.amountAlt, currency.symbol)}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">{formatDateShort(transaction.date)}</p>
          {transaction.imageId && (
            <button
              onClick={e => { e.stopPropagation(); setViewingImage(true) }}
              className="mt-1 flex items-center justify-end gap-0.5 text-slate-300 hover:text-slate-400"
            >
              <Camera size={11} />
            </button>
          )}
        </div>
      </div>

      {showActions && (
        <div className="px-4 pb-1 space-y-2">
          {/* Detalle: observaciones + autor */}
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-xs space-y-1.5">
            {transaction.notes && (
              <p className="text-slate-500">
                <span className="font-semibold text-slate-600">Observaciones: </span>
                {transaction.notes}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-slate-400">
              <User size={12} />
              Registrado por <span className="font-medium text-slate-600">{creatorName}</span>
            </p>
          </div>

          {canModify ? (
            <div className="flex gap-2">
              <button
                onClick={() => { openEditTransaction(transaction.id); setShowActions(false) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-medium"
              >
                <Pencil size={13} /> Editar
              </button>
              <button
                onClick={() => { setConfirmDelete(true); setShowActions(false) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-medium"
              >
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 text-center py-1.5">
              Solo un administrador o quien lo registró puede editarlo.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar ${isIncome ? 'ingreso' : 'gasto'}?`}
        message={`Se eliminará "${transaction.description}" por ${formatCurrencyFull(transaction.amount, settings)}.`}
        onConfirm={() => { deleteTransaction(transaction.id); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)}
      />

      {viewingImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => { setViewingImage(false); setImageUrl(null) }}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white"
            onClick={() => { setViewingImage(false); setImageUrl(null) }}
          >
            <X size={22} />
          </button>
          {imageUrl
            ? <img
                src={imageUrl}
                className="max-w-full max-h-full object-contain rounded-lg"
                alt="comprobante"
                onClick={e => e.stopPropagation()}
              />
            : <div className="text-white text-sm opacity-60">Cargando...</div>
          }
        </div>
      )}
    </>
  )
}
