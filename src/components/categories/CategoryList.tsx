import { useState } from 'react'
import { ChevronDown, ChevronRight, MoreVertical, Tag } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import type { Category } from '../../types'
import { CategoryIcon } from './CategoryIcon'
import { CategoryFormSheet } from './CategoryFormSheet'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmptyState } from '../ui/EmptyState'
import { SubcategoryList } from './SubcategoryList'

export function CategoryList() {
  const { categories, deleteCategory } = useDataStore()
  const sorted = [...categories].sort((a, b) => a.order - b.order)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Sin categorías"
        description="Creá tu primera categoría para empezar a organizar tus gastos."
      />
    )
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {sorted.map(cat => (
        <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header de categoría */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <button onClick={() => toggle(cat.id)} className="flex items-center gap-3 flex-1 min-w-0">
              <CategoryIcon name={cat.icon} color={cat.color} size={20} />
              <span className="font-semibold text-slate-800 text-sm truncate">{cat.name}</span>
              {expanded.has(cat.id)
                ? <ChevronDown size={16} className="text-slate-400 ml-auto flex-shrink-0" />
                : <ChevronRight size={16} className="text-slate-400 ml-auto flex-shrink-0" />
              }
            </button>
            <button
              onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
              className="p-1.5 text-slate-400 rounded-lg"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Mini menú contextual */}
          {menuOpen === cat.id && (
            <div className="border-t border-slate-50 px-4 py-2 flex gap-4 bg-slate-50">
              <button
                onClick={() => { setEditing(cat); setMenuOpen(null) }}
                className="text-xs text-brand-600 font-medium py-1"
              >
                Editar
              </button>
              <button
                onClick={() => { setDeleting(cat); setMenuOpen(null) }}
                className="text-xs text-red-500 font-medium py-1"
              >
                Eliminar
              </button>
            </div>
          )}

          {/* Subcategorías expandibles */}
          {expanded.has(cat.id) && (
            <div className="border-t border-slate-50">
              <SubcategoryList categoryId={cat.id} categoryColor={cat.color} />
            </div>
          )}
        </div>
      ))}

      {/* Sheet de edición */}
      {editing && (
        <CategoryFormSheet
          open={!!editing}
          onClose={() => setEditing(null)}
          editing={editing}
        />
      )}

      {/* Confirmación de borrado */}
      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar categoría?"
        message={`Se eliminará "${deleting?.name}" junto con todas sus subcategorías, ítems de presupuesto y gastos asociados.`}
        onConfirm={() => { deleting && deleteCategory(deleting.id); setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
