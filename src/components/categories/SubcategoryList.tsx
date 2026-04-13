import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import type { Subcategory } from '../../types'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface Props {
  categoryId: string
  categoryColor: string
}

export function SubcategoryList({ categoryId, categoryColor }: Props) {
  const {
    subcategories, subSubcategories,
    addSubcategory, updateSubcategory, deleteSubcategory,
    addSubSubcategory, deleteSubSubcategory,
  } = useDataStore()

  const subs = subcategories.filter(s => s.categoryId === categoryId).sort((a, b) => a.order - b.order)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [newSubName, setNewSubName] = useState('')
  const [addingSubSub, setAddingSubSub] = useState<string | null>(null)
  const [newSubSubName, setNewSubSubName] = useState('')
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null)
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editingSubName, setEditingSubName] = useState('')

  const toggleSub = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleAddSub = () => {
    const trimmed = newSubName.trim()
    if (!trimmed) return
    addSubcategory(categoryId, trimmed)
    setNewSubName('')
  }

  const handleAddSubSub = (subId: string) => {
    const trimmed = newSubSubName.trim()
    if (!trimmed) return
    addSubSubcategory(subId, trimmed)
    setNewSubSubName('')
    setAddingSubSub(null)
  }

  const handleEditSub = (sub: Subcategory) => {
    setEditingSubId(sub.id)
    setEditingSubName(sub.name)
  }

  const handleSaveEditSub = (id: string) => {
    const trimmed = editingSubName.trim()
    if (trimmed) updateSubcategory(id, { name: trimmed })
    setEditingSubId(null)
  }

  return (
    <div className="px-4 py-2 space-y-1">
      {subs.map(sub => {
        const subSubs = subSubcategories.filter(ss => ss.subcategoryId === sub.id).sort((a, b) => a.order - b.order)
        const isExpanded = expanded.has(sub.id)

        return (
          <div key={sub.id}>
            {/* Fila subcategoría */}
            <div className="flex items-center gap-2 py-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor }} />

              {editingSubId === sub.id ? (
                <input
                  autoFocus
                  value={editingSubName}
                  onChange={e => setEditingSubName(e.target.value)}
                  onBlur={() => handleSaveEditSub(sub.id)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEditSub(sub.id)}
                  className="flex-1 text-sm border-b border-brand-400 outline-none bg-transparent text-slate-800 pb-0.5"
                />
              ) : (
                <button
                  onDoubleClick={() => handleEditSub(sub)}
                  onClick={() => toggleSub(sub.id)}
                  className="flex-1 text-left text-sm text-slate-700 font-medium"
                >
                  {sub.name}
                </button>
              )}

              <button
                onClick={() => toggleSub(sub.id)}
                className="text-slate-300 p-0.5"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                onClick={() => setAddingSubSub(addingSubSub === sub.id ? null : sub.id)}
                className="text-slate-300 p-0.5"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setDeletingSub(sub)}
                className="text-slate-300 p-0.5"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Sub-subcategorías */}
            {isExpanded && (
              <div className="ml-5 space-y-1 mb-1">
                {subSubs.map(ss => (
                  <div key={ss.id} className="flex items-center gap-2 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0" />
                    <span className="flex-1 text-xs text-slate-600">{ss.name}</span>
                    <button
                      onClick={() => deleteSubSubcategory(ss.id)}
                      className="text-slate-300 p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* Agregar sub-subcategoría */}
                {addingSubSub === sub.id && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0" />
                    <input
                      autoFocus
                      value={newSubSubName}
                      onChange={e => setNewSubSubName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSubSub(sub.id); if (e.key === 'Escape') { setAddingSubSub(null); setNewSubSubName('') } }}
                      placeholder="Nueva sub-subcategoría"
                      className="flex-1 text-xs border-b border-brand-400 outline-none bg-transparent text-slate-700 pb-0.5"
                    />
                    <button onClick={() => handleAddSubSub(sub.id)} className="text-brand-500 text-xs font-medium">OK</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Agregar subcategoría */}
      <div className="flex items-center gap-2 pt-1 pb-2">
        <Plus size={14} className="text-slate-300 flex-shrink-0" />
        <input
          value={newSubName}
          onChange={e => setNewSubName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSub()}
          placeholder="Agregar subcategoría"
          className="flex-1 text-sm text-slate-500 outline-none bg-transparent placeholder:text-slate-300"
        />
        {newSubName && (
          <button onClick={handleAddSub} className="text-brand-500 text-xs font-medium">Agregar</button>
        )}
      </div>

      {/* Confirmación borrado subcategoría */}
      <ConfirmDialog
        open={!!deletingSub}
        title="¿Eliminar subcategoría?"
        message={`Se eliminará "${deletingSub?.name}" con sus sub-subcategorías, presupuestos y gastos asociados.`}
        onConfirm={() => { deletingSub && deleteSubcategory(deletingSub.id); setDeletingSub(null) }}
        onCancel={() => setDeletingSub(null)}
      />
    </div>
  )
}
