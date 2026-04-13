import { useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ShoppingListCard } from '../components/shopping/ShoppingListCard'
import { ShoppingListFormSheet } from '../components/shopping/ShoppingListFormSheet'
import { EmptyState } from '../components/ui/EmptyState'
import { useDataStore } from '../store/dataStore'
import type { ShoppingList } from '../types'

export function ShoppingListPage() {
  const { shoppingLists } = useDataStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShoppingList | undefined>()

  const sorted = [...shoppingLists].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const handleEditList = (list: ShoppingList) => {
    setEditingList(list)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Lista de compras"
        right={
          <button
            onClick={() => { setEditingList(undefined); setFormOpen(true) }}
            className="flex items-center gap-1 bg-brand-500 text-white text-sm font-medium px-3 py-1.5 rounded-xl"
          >
            <Plus size={16} /> Nueva lista
          </button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Sin listas de compras"
          description="Creá una lista, agregá ítems con montos estimados y ejecutalos para registrar el gasto automáticamente."
        />
      ) : (
        <div className="px-4 py-4 space-y-4">
          {sorted.map(list => (
            <ShoppingListCard key={list.id} list={list} onEditList={handleEditList} />
          ))}
        </div>
      )}

      <ShoppingListFormSheet
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingList(undefined) }}
        editing={editingList}
      />
    </div>
  )
}
