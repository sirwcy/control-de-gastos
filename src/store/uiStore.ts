import { create } from 'zustand'
import type { ID, TransactionType } from '../types'

interface UIState {
  // Sheet de agregar/editar transacción (FAB)
  transactionSheetOpen: boolean
  editTransactionId: ID | null
  defaultTransactionType: TransactionType
  openAddTransaction: (type?: TransactionType) => void
  openEditTransaction: (id: ID) => void
  closeTransactionSheet: () => void

  // Sheet de agregar ítem de presupuesto
  addBudgetItemOpen: boolean
  openAddBudgetItem: () => void
  closeBudgetItemSheet: () => void

  // Período seleccionado para visualización
  selectedPeriodId: ID | null
  setSelectedPeriodId: (id: ID) => void
}

export const useUIStore = create<UIState>((set) => ({
  transactionSheetOpen: false,
  editTransactionId: null,
  defaultTransactionType: 'expense',
  openAddTransaction: (type = 'expense') => set({ transactionSheetOpen: true, editTransactionId: null, defaultTransactionType: type }),
  openEditTransaction: (id) => set({ transactionSheetOpen: true, editTransactionId: id }),
  closeTransactionSheet: () => set({ transactionSheetOpen: false, editTransactionId: null }),

  addBudgetItemOpen: false,
  openAddBudgetItem: () => set({ addBudgetItemOpen: true }),
  closeBudgetItemSheet: () => set({ addBudgetItemOpen: false }),

  selectedPeriodId: null,
  setSelectedPeriodId: (id) => set({ selectedPeriodId: id }),
}))
