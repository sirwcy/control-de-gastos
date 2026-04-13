import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { CategoryList } from '../components/categories/CategoryList'
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet'

export function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Categorías"
        right={
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1 bg-brand-500 text-white text-sm font-medium px-3 py-1.5 rounded-xl"
          >
            <Plus size={16} /> Nueva
          </button>
        }
      />
      <CategoryList />
      <CategoryFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
