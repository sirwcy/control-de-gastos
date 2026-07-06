import { useState, useRef } from 'react'
import { ChevronRight, ChevronDown, Check, Plus } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import type { CategoryRef, Category } from '../../types'
import { CategoryIcon } from './CategoryIcon'
import { CategoryFormSheet } from './CategoryFormSheet'

interface Props {
  value: CategoryRef | null
  onChange: (ref: CategoryRef) => void
}

export function CategoryPicker({ value, onChange }: Props) {
  const { categories, subcategories, subSubcategories, addSubcategory, addSubSubcategory } = useDataStore()
  const sorted = [...categories].sort((a, b) => a.order - b.order)

  const [expandedCat, setExpandedCat]   = useState<string | null>(null)
  const [expandedSub, setExpandedSub]   = useState<string | null>(null)

  // Creación inline de subcategorías y sub-subcategorías
  const [addingSubFor, setAddingSubFor]       = useState<string | null>(null) // categoryId
  const [addingSubSubFor, setAddingSubSubFor] = useState<string | null>(null) // subcategoryId
  const [inlineName, setInlineName]           = useState('')

  // Creación de categoría nueva (abre el sheet)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  const inlineInputRef = useRef<HTMLInputElement>(null)

  const isSelected = (ref: CategoryRef) => {
    if (!value) return false
    if (ref.level !== value.level) return false
    if (ref.categoryId !== value.categoryId) return false
    if (ref.level === 'subcategory' && ref.subcategoryId !== value.subcategoryId) return false
    if (ref.level === 'sub_subcategory' && ref.subSubcategoryId !== value.subSubcategoryId) return false
    return true
  }

  const openAddSub = (catId: string) => {
    setAddingSubFor(catId)
    setAddingSubSubFor(null)
    setInlineName('')
    setExpandedCat(catId)
    setTimeout(() => inlineInputRef.current?.focus(), 50)
  }

  const openAddSubSub = (subId: string, catId: string) => {
    setAddingSubSubFor(subId)
    setAddingSubFor(null)
    setInlineName('')
    setExpandedCat(catId)
    setExpandedSub(subId)
    setTimeout(() => inlineInputRef.current?.focus(), 50)
  }

  const commitAddSub = async (catId: string) => {
    const trimmed = inlineName.trim()
    if (!trimmed) { setAddingSubFor(null); return }
    const created = await addSubcategory(catId, trimmed)
    setAddingSubFor(null)
    setInlineName('')
    onChange({ level: 'subcategory', categoryId: catId, subcategoryId: created.id })
    setExpandedCat(catId)
  }

  const commitAddSubSub = async (subId: string, catId: string) => {
    const trimmed = inlineName.trim()
    if (!trimmed) { setAddingSubSubFor(null); return }
    const created = await addSubSubcategory(subId, trimmed)
    setAddingSubSubFor(null)
    setInlineName('')
    onChange({ level: 'sub_subcategory', categoryId: catId, subcategoryId: subId, subSubcategoryId: created.id })
  }

  const handleCategoryCreated = (cat: Category) => {
    onChange({ level: 'category', categoryId: cat.id })
    setExpandedCat(cat.id)
  }

  return (
    <div className="divide-y divide-slate-50">
      {sorted.map(cat => {
        const catSubs     = subcategories.filter(s => s.categoryId === cat.id).sort((a, b) => a.order - b.order)
        const catRef: CategoryRef = { level: 'category', categoryId: cat.id }
        const isCatExpanded = expandedCat === cat.id

        return (
          <div key={cat.id}>
            {/* Categoría */}
            <div className="flex items-center gap-3 px-5 py-3">
              <button
                onClick={() => {
                  onChange(catRef)
                  if (catSubs.length > 0) setExpandedCat(cat.id)
                }}
                className="flex items-center gap-3 flex-1"
              >
                <CategoryIcon name={cat.icon} color={cat.color} size={18} />
                <span className="text-sm font-medium text-slate-800 flex-1 text-left">{cat.name}</span>
                {isSelected(catRef) && <Check size={16} className="text-brand-500" />}
              </button>

              {/* + subcategoría */}
              <button
                onClick={() => openAddSub(cat.id)}
                className="p-1 text-slate-300 hover:text-brand-400"
                title="Nueva subcategoría"
              >
                <Plus size={14} />
              </button>

              {catSubs.length > 0 && (
                <button
                  onClick={() => setExpandedCat(isCatExpanded ? null : cat.id)}
                  className="p-1 text-slate-300"
                >
                  {isCatExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
            </div>

            {/* Input inline nueva subcategoría */}
            {addingSubFor === cat.id && (
              <div className="flex items-center gap-2 pl-14 pr-5 py-2 bg-brand-50/50">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <input
                  ref={inlineInputRef}
                  value={inlineName}
                  onChange={e => setInlineName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitAddSub(cat.id)
                    if (e.key === 'Escape') { setAddingSubFor(null); setInlineName('') }
                  }}
                  placeholder="Nueva subcategoría..."
                  className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder:text-slate-300"
                />
                <button
                  onClick={() => commitAddSub(cat.id)}
                  disabled={!inlineName.trim()}
                  className="text-xs font-semibold text-brand-500 disabled:opacity-30"
                >
                  OK
                </button>
              </div>
            )}

            {/* Subcategorías */}
            {isCatExpanded && catSubs.map(sub => {
              const subSubs   = subSubcategories.filter(ss => ss.subcategoryId === sub.id).sort((a, b) => a.order - b.order)
              const subRef: CategoryRef = { level: 'subcategory', categoryId: cat.id, subcategoryId: sub.id }
              const isSubExpanded = expandedSub === sub.id

              return (
                <div key={sub.id} className="bg-slate-50/70">
                  <div className="flex items-center gap-2 pl-14 pr-5 py-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <button
                      onClick={() => {
                        onChange(subRef)
                        if (subSubs.length > 0) setExpandedSub(sub.id)
                      }}
                      className="flex-1 text-left text-sm text-slate-700 flex items-center"
                    >
                      <span className="flex-1">{sub.name}</span>
                      {isSelected(subRef) && <Check size={14} className="text-brand-500" />}
                    </button>

                    {/* + sub-subcategoría */}
                    <button
                      onClick={() => openAddSubSub(sub.id, cat.id)}
                      className="p-1 text-slate-300 hover:text-brand-400"
                      title="Nueva sub-subcategoría"
                    >
                      <Plus size={12} />
                    </button>

                    {subSubs.length > 0 && (
                      <button
                        onClick={() => setExpandedSub(isSubExpanded ? null : sub.id)}
                        className="p-1 text-slate-300"
                      >
                        {isSubExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Input inline nueva sub-subcategoría */}
                  {addingSubSubFor === sub.id && (
                    <div className="flex items-center gap-2 pl-20 pr-5 py-2 bg-brand-50/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                      <input
                        ref={inlineInputRef}
                        value={inlineName}
                        onChange={e => setInlineName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitAddSubSub(sub.id, cat.id)
                          if (e.key === 'Escape') { setAddingSubSubFor(null); setInlineName('') }
                        }}
                        placeholder="Nueva sub-subcategoría..."
                        className="flex-1 text-xs outline-none bg-transparent text-slate-600 placeholder:text-slate-300"
                      />
                      <button
                        onClick={() => commitAddSubSub(sub.id, cat.id)}
                        disabled={!inlineName.trim()}
                        className="text-xs font-semibold text-brand-500 disabled:opacity-30"
                      >
                        OK
                      </button>
                    </div>
                  )}

                  {/* Sub-subcategorías */}
                  {isSubExpanded && subSubs.map(ss => {
                    const ssRef: CategoryRef = { level: 'sub_subcategory', categoryId: cat.id, subcategoryId: sub.id, subSubcategoryId: ss.id }
                    return (
                      <button
                        key={ss.id}
                        onClick={() => onChange(ssRef)}
                        className="flex items-center gap-2 pl-20 pr-5 py-2.5 w-full bg-slate-100/60"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                        <span className="flex-1 text-left text-xs text-slate-600">{ss.name}</span>
                        {isSelected(ssRef) && <Check size={12} className="text-brand-500" />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Botón nueva categoría */}
      <button
        onClick={() => setShowCategoryForm(true)}
        className="flex items-center gap-2 px-5 py-3.5 w-full text-sm text-brand-500 font-medium"
      >
        <Plus size={15} />
        Nueva categoría
      </button>

      {showCategoryForm && (
        <CategoryFormSheet
          open={showCategoryForm}
          onClose={() => setShowCategoryForm(false)}
          onCreated={handleCategoryCreated}
        />
      )}
    </div>
  )
}
