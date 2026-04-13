import { useState } from 'react'
import { MoreVertical, Plus, Check, RotateCcw, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { ShoppingList, ShoppingListItem } from '../../types'
import { useDataStore } from '../../store/dataStore'
import { formatCurrencyFull } from '../../lib/formatters'
import { CategoryIcon } from '../categories/CategoryIcon'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ShoppingListItemFormSheet } from './ShoppingListItemFormSheet'
import { CheckItemSheet } from './CheckItemSheet'

interface Props {
  list: ShoppingList
  onEditList: (list: ShoppingList) => void
}

export function ShoppingListCard({ list, onEditList }: Props) {
  const { shoppingListItems, deleteShoppingList, deleteShoppingListItem, uncheckShoppingListItem, categories, settings } = useDataStore()

  const [menuOpen, setMenuOpen]       = useState(false)
  const [collapsed, setCollapsed]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingListItem | undefined>()
  const [checkingItem, setCheckingItem] = useState<ShoppingListItem | null>(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<ShoppingListItem | null>(null)

  const items = shoppingListItems.filter(i => i.listId === list.id)
  const unchecked = items.filter(i => !i.checked)
  const checked   = items.filter(i => i.checked)

  // Agrupar TODOS los ítems por categoría (para el encabezado con agregados)
  const groupedAll = items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    const key = item.categoryRef?.categoryId ?? '__none__'
    ;(acc[key] ??= []).push(item)
    return acc
  }, {})

  // Mantener orden: categorías con ítems sin marcar primero
  const catOrder = [...new Set(unchecked.map(i => i.categoryRef?.categoryId ?? '__none__'))]
  checked.forEach(i => {
    const k = i.categoryRef?.categoryId ?? '__none__'
    if (!catOrder.includes(k)) catOrder.push(k)
  })

  const totalEstimated   = items.reduce((s, i) => s + i.estimatedAmount, 0)
  const totalActual      = checked.reduce((s, i) => s + (i.actualAmount ?? 0), 0)
  const totalChecked     = checked.length
  const pendingEstimated = unchecked.reduce((s, i) => s + i.estimatedAmount, 0)
  const diff             = totalActual - checked.reduce((s, i) => s + i.estimatedAmount, 0)
  const hasActual        = totalActual > 0
  const hasDiff          = hasActual && checked.some(i => i.estimatedAmount > 0)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Cabecera de la lista */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="flex-shrink-0 text-slate-400"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="flex-1 text-left font-bold text-slate-800 text-base truncate"
            >
              {list.name}
            </button>
            <button
              onClick={() => setAddItemOpen(true)}
              className="p-2 rounded-xl bg-brand-50 text-brand-600 flex-shrink-0"
            >
              <Plus size={16} />
            </button>
            <button onClick={() => setMenuOpen(m => !m)} className="text-slate-300 p-1 flex-shrink-0">
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Resumen teórico vs real */}
          {items.length > 0 && (
            <div className="space-y-2">
              {/* Barra de progreso de ítems completados */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(totalChecked / items.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {totalChecked}/{items.length}
                </span>
              </div>

              {/* Comparación presupuestado vs gastado */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Estimado</p>
                  <p className="text-sm font-bold text-slate-600">
                    {totalEstimated > 0 ? formatCurrencyFull(totalEstimated, settings) : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Ejecutado</p>
                  <p className="text-sm font-bold text-slate-800">
                    {hasActual ? formatCurrencyFull(totalActual, settings) : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Diferencia</p>
                  {hasDiff ? (
                    <p className={`text-sm font-bold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {diff > 0 ? '+' : ''}{formatCurrencyFull(diff, settings)}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-slate-300">—</p>
                  )}
                </div>
              </div>

              {/* Pendiente por ejecutar */}
              {unchecked.length > 0 && pendingEstimated > 0 && (
                <p className="text-xs text-slate-400 text-center pt-0.5">
                  Pendiente: <span className="font-semibold text-slate-500">{formatCurrencyFull(pendingEstimated, settings)}</span> estimado en {unchecked.length} ítem{unchecked.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Menú lista */}
        {menuOpen && (
          <div className="border-t border-slate-50 px-4 py-2 flex gap-4 bg-slate-50">
            <button onClick={() => { onEditList(list); setMenuOpen(false) }} className="text-xs text-brand-600 font-medium py-1">Editar nombre</button>
            <button onClick={() => { setConfirmDelete(true); setMenuOpen(false) }} className="text-xs text-red-500 font-medium py-1">Eliminar lista</button>
          </div>
        )}

        {/* Contenido de la lista — agrupado por categoría */}
        {!collapsed && items.length > 0 && (
          <div className="border-t border-slate-50">
            {catOrder.map(catId => {
              const catItems  = groupedAll[catId] ?? []
              const cat       = catId !== '__none__' ? categories.find(c => c.id === catId) : null
              const catEst    = catItems.reduce((s, i) => s + i.estimatedAmount, 0)
              const catAct    = catItems.filter(i => i.checked).reduce((s, i) => s + (i.actualAmount ?? 0), 0)
              const catDiff   = catAct - catItems.filter(i => i.checked).reduce((s, i) => s + i.estimatedAmount, 0)
              const catChecked = catItems.filter(i => i.checked)
              const catHasAct  = catChecked.length > 0 && catAct > 0

              return (
                <div key={catId}>
                  {/* Encabezado de categoría con agregados */}
                  {cat && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/70 border-b border-slate-100">
                      <CategoryIcon name={cat.icon} color={cat.color} size={13} />
                      <span className="text-xs font-semibold text-slate-600 flex-1">{cat.name}</span>
                      <span className="text-xs font-mono text-slate-500">
                        {catEst > 0 ? formatCurrencyFull(catEst, settings) : '—'}
                        {catHasAct && (
                          <>
                            <span className="text-slate-300"> / </span>
                            <span className="text-slate-700">{formatCurrencyFull(catAct, settings)}</span>
                            <span className={catDiff > 0 ? ' text-red-500' : catDiff < 0 ? ' text-emerald-600' : ' text-slate-400'}>
                              {' '}{catDiff > 0 ? '+' : ''}{formatCurrencyFull(catDiff, settings)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Sin categoría: encabezado mínimo */}
                  {!cat && catId === '__none__' && catItems.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50/40 border-b border-slate-50">
                      <span className="text-xs text-slate-400 italic flex-1">Sin categoría</span>
                      {catEst > 0 && <span className="text-xs font-mono text-slate-400">{formatCurrencyFull(catEst, settings)}</span>}
                    </div>
                  )}

                  {/* Ítems de esta categoría: primero sin marcar, luego marcados */}
                  {catItems.filter(i => !i.checked).map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onCheck={() => setCheckingItem(item)}
                      onEdit={() => { setEditingItem(item); setAddItemOpen(true) }}
                      onDelete={() => setConfirmDeleteItem(item)}
                    />
                  ))}
                  {catItems.filter(i => i.checked).map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onCheck={() => uncheckShoppingListItem(item.id)}
                      onEdit={() => { setEditingItem(item); setAddItemOpen(true) }}
                      onDelete={() => setConfirmDeleteItem(item)}
                      isChecked
                    />
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {!collapsed && items.length === 0 && (
          <div className="border-t border-slate-50 px-4 py-5 text-center">
            <p className="text-sm text-slate-400">Lista vacía. Tocá + para agregar ítems.</p>
          </div>
        )}
      </div>

      <ShoppingListItemFormSheet
        open={addItemOpen}
        onClose={() => { setAddItemOpen(false); setEditingItem(undefined) }}
        listId={list.id}
        editing={editingItem}
      />

      <CheckItemSheet
        open={!!checkingItem}
        onClose={() => setCheckingItem(null)}
        item={checkingItem}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar lista?"
        message={`Se eliminará "${list.name}" y todos sus ítems.`}
        onConfirm={() => { deleteShoppingList(list.id); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={!!confirmDeleteItem}
        title="¿Eliminar ítem?"
        message={`Se eliminará "${confirmDeleteItem?.name}"${confirmDeleteItem?.checked ? ' y su gasto registrado.' : '.'}`}
        onConfirm={() => { confirmDeleteItem && deleteShoppingListItem(confirmDeleteItem.id); setConfirmDeleteItem(null) }}
        onCancel={() => setConfirmDeleteItem(null)}
      />
    </>
  )
}

// ─── Fila de ítem ─────────────────────────────────────────────────────────────
interface ItemRowProps {
  item: ShoppingListItem
  onCheck: () => void
  onEdit: () => void
  onDelete: () => void
  isChecked?: boolean
}

function ItemRow({ item, onCheck, onEdit, onDelete, isChecked }: ItemRowProps) {
  const { settings } = useDataStore()
  const [showActions, setShowActions] = useState(false)

  return (
    <div>
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${isChecked ? 'opacity-60' : ''}`}
        onClick={() => setShowActions(s => !s)}
      >
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onCheck() }}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
          }`}
        >
          {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>

        {/* Nombre y notas */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {item.name}
          </p>
          {item.notes && <p className="text-xs text-slate-400 truncate italic">{item.notes}</p>}
        </div>

        {/* Montos: estimado / real  saldo */}
        <div className="text-right flex-shrink-0">
          {isChecked && item.actualAmount != null ? (
            <>
              {/* Formato: est / real  saldo */}
              <p className="text-xs font-mono leading-tight">
                <span className="text-slate-400">{item.estimatedAmount > 0 ? formatCurrencyFull(item.estimatedAmount, settings) : '—'}</span>
                <span className="text-slate-300"> / </span>
                <span className="text-slate-700 font-semibold">{formatCurrencyFull(item.actualAmount, settings)}</span>
              </p>
              {item.estimatedAmount > 0 && (() => {
                const d = item.actualAmount - item.estimatedAmount
                return (
                  <p className={`text-[10px] font-bold ${d > 0 ? 'text-red-500' : d < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {d > 0 ? '+' : ''}{formatCurrencyFull(d, settings)}
                  </p>
                )
              })()}
            </>
          ) : item.estimatedAmount > 0 ? (
            <p className="text-xs font-semibold text-slate-400">
              {formatCurrencyFull(item.estimatedAmount, settings)}
            </p>
          ) : null}
        </div>

        {isChecked && <RotateCcw size={13} className="text-slate-300 flex-shrink-0" />}
      </div>

      {showActions && !isChecked && (
        <div className="flex gap-2 px-4 pb-2">
          <button
            onClick={() => { onEdit(); setShowActions(false) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-50 text-brand-600 rounded-xl text-xs font-medium"
          >
            <Pencil size={12} /> Editar
          </button>
          <button
            onClick={() => { onDelete(); setShowActions(false) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-medium"
          >
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )}
    </div>
  )
}
