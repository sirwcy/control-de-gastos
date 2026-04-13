import { useState, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useDataStore } from '../../store/dataStore'
import type { ShoppingList } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: ShoppingList
}

export function ShoppingListFormSheet({ open, onClose, editing }: Props) {
  const { addShoppingList, updateShoppingList } = useDataStore()
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName(editing?.name ?? '')
  }, [open, editing])

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (editing) {
      updateShoppingList(editing.id, trimmed)
    } else {
      addShoppingList(trimmed)
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? 'Editar lista' : 'Nueva lista'}>
      <div className="p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nombre de la lista</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="ej: Compras del mes, Supermercado..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-2xl disabled:opacity-40"
        >
          {editing ? 'Guardar cambios' : 'Crear lista'}
        </button>
      </div>
    </BottomSheet>
  )
}
