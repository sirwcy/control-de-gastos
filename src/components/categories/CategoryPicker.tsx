import { useState } from 'react'
import { ChevronRight, ChevronDown, Check } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import type { CategoryRef } from '../../types'
import { CategoryIcon } from './CategoryIcon'

interface Props {
  value: CategoryRef | null
  onChange: (ref: CategoryRef) => void
}

export function CategoryPicker({ value, onChange }: Props) {
  const { categories, subcategories, subSubcategories } = useDataStore()
  const sorted = [...categories].sort((a, b) => a.order - b.order)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)

  const isSelected = (ref: CategoryRef) => {
    if (!value) return false
    if (ref.level !== value.level) return false
    if (ref.categoryId !== value.categoryId) return false
    if (ref.level === 'subcategory' && ref.subcategoryId !== value.subcategoryId) return false
    if (ref.level === 'sub_subcategory' && ref.subSubcategoryId !== value.subSubcategoryId) return false
    return true
  }

  return (
    <div className="divide-y divide-slate-50">
      {sorted.map(cat => {
        const catSubs = subcategories.filter(s => s.categoryId === cat.id).sort((a, b) => a.order - b.order)
        const catRef: CategoryRef = { level: 'category', categoryId: cat.id }
        const isCatExpanded = expandedCat === cat.id

        return (
          <div key={cat.id}>
            {/* Categoría */}
            <div className="flex items-center gap-3 px-5 py-3">
              <button
                onClick={() => {
                  onChange(catRef)
                  if (catSubs.length > 0) setExpandedCat(cat.id) // auto-expandir subcategorías
                }}
                className="flex items-center gap-3 flex-1"
              >
                <CategoryIcon name={cat.icon} color={cat.color} size={18} />
                <span className="text-sm font-medium text-slate-800 flex-1 text-left">{cat.name}</span>
                {isSelected(catRef) && <Check size={16} className="text-brand-500" />}
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

            {/* Subcategorías */}
            {isCatExpanded && catSubs.map(sub => {
              const subSubs = subSubcategories.filter(ss => ss.subcategoryId === sub.id).sort((a, b) => a.order - b.order)
              const subRef: CategoryRef = { level: 'subcategory', categoryId: cat.id, subcategoryId: sub.id }
              const isSubExpanded = expandedSub === sub.id

              return (
                <div key={sub.id} className="bg-slate-50/70">
                  <div className="flex items-center gap-2 pl-14 pr-5 py-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <button
                      onClick={() => {
                        onChange(subRef)
                        if (subSubs.length > 0) setExpandedSub(sub.id) // auto-expandir sub-subcategorías
                      }}
                      className="flex-1 text-left text-sm text-slate-700 flex items-center"
                    >
                      <span className="flex-1">{sub.name}</span>
                      {isSelected(subRef) && <Check size={14} className="text-brand-500" />}
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
    </div>
  )
}
