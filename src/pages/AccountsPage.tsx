import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { AccountCard } from '../components/accounts/AccountCard'
import { AccountFormSheet } from '../components/accounts/AccountFormSheet'
import { useDataStore } from '../store/dataStore'
import { EmptyState } from '../components/ui/EmptyState'

export function AccountsPage() {
  const { accounts } = useDataStore()
  const [formOpen, setFormOpen] = useState(false)

  const sorted = [...accounts].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Cuentas"
        right={
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1 bg-brand-500 text-white text-sm font-medium px-3 py-1.5 rounded-xl"
          >
            <Plus size={16} /> Nueva
          </button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin cuentas"
          description="Creá tu primera cuenta para registrar dónde guardás tu dinero."
        />
      ) : (
        <div className="px-4 py-4 space-y-3">
          {sorted.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <AccountFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
