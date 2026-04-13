import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/constants'
import { CategoryIcon } from './CategoryIcon'
import { useDataStore } from '../../store/dataStore'
import type { Category } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Category
}

export function CategoryFormSheet({ open, onClose, editing }: Props) {
  const { addCategory, updateCategory } = useDataStore()
  const [name, setName]   = useState(editing?.name ?? '')
  const [color, setColor] = useState(editing?.color ?? CATEGORY_COLORS[0])
  const [icon, setIcon]   = useState(editing?.icon ?? CATEGORY_ICONS[0])

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (editing) {
      updateCategory(editing.id, { name: trimmed, color, icon })
    } else {
      addCategory({ name: trimmed, color, icon })
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? 'Editar categoría' : 'Nueva categoría'} fullHeight>
      <div className="p-5 space-y-5" onKeyDown={e => e.key === 'Enter' && handleSave()}>
        {/* Preview */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
          <CategoryIcon name={icon} color={color} size={22} />
          <span className="font-semibold text-slate-700">{name || 'Sin nombre'}</span>
        </div>

        {/* Nombre */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nombre</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej: Alimentación"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none focus:border-brand-500"
          />
        </div>

        {/* Colores */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{ backgroundColor: c }}
              >
                {color === c && <span className="text-white text-base">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Íconos */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Ícono</label>
          <div className="grid grid-cols-7 gap-2">
            {CATEGORY_ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`p-2 rounded-xl transition-colors ${icon === ic ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-slate-100'}`}
              >
                <CategoryIcon name={ic} color={icon === ic ? color : '#94a3b8'} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-2xl disabled:opacity-40"
        >
          {editing ? 'Guardar cambios' : 'Crear categoría'}
        </button>
      </div>
    </BottomSheet>
  )
}
