import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import { useUIStore } from '../../store/uiStore'
import { MONTHS_ES } from '../../lib/constants'

export function PeriodSelector() {
  const { budgetPeriods, addBudgetPeriod } = useDataStore()
  const { selectedPeriodId, setSelectedPeriodId } = useUIStore()
  const [open, setOpen] = useState(false)

  const sorted = [...budgetPeriods].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month
  )

  const activePeriod = budgetPeriods.find(p => p.isActive)
  const currentId = selectedPeriodId ?? activePeriod?.id
  const current = budgetPeriods.find(p => p.id === currentId)

  const currentIndex = sorted.findIndex(p => p.id === currentId)

  const goPrev = () => {
    if (currentIndex < sorted.length - 1) setSelectedPeriodId(sorted[currentIndex + 1].id)
  }
  const goNext = () => {
    if (currentIndex > 0) setSelectedPeriodId(sorted[currentIndex - 1].id)
  }

  const createNext = async () => {
    const now = new Date()
    const ref = current ?? { month: now.getMonth() + 1, year: now.getFullYear() }
    let month = ref.month + 1
    let year  = ref.year
    if (month > 12) { month = 1; year++ }
    const existing = budgetPeriods.find(p => p.month === month && p.year === year)
    if (existing) {
      setSelectedPeriodId(existing.id)
    } else {
      const p = await addBudgetPeriod(month, year)
      setSelectedPeriodId(p.id)
    }
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button onClick={goPrev} className="p-1 text-slate-400 disabled:opacity-20" disabled={currentIndex >= sorted.length - 1}>
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => setOpen(o => !o)} className="text-xs font-semibold text-slate-600 min-w-[80px] text-center">
          {current ? `${MONTHS_ES[current.month - 1].slice(0, 3)} ${current.year}` : '—'}
        </button>
        <button onClick={goNext} className="p-1 text-slate-400 disabled:opacity-20" disabled={currentIndex <= 0}>
          <ChevronRight size={18} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 w-48 overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {sorted.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedPeriodId(p.id); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${p.id === currentId ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100">
            <button
              onClick={createNext}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-600 font-medium"
            >
              <Plus size={14} /> Nuevo período
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
