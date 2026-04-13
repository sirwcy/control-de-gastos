import { useDataStore } from '../store/dataStore'
import { useUIStore } from '../store/uiStore'

export function usePeriodId(): string {
  const activePeriodId = useDataStore(s => s.budgetPeriods.find(p => p.isActive)?.id)
  const selectedPeriodId = useUIStore(s => s.selectedPeriodId)
  return selectedPeriodId ?? activePeriodId ?? ''
}

export function useCurrentPeriod() {
  const periodId = usePeriodId()
  const period = useDataStore(s => s.budgetPeriods.find(p => p.id === periodId))
  return { periodId, period }
}
