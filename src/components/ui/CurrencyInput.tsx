import { useRef } from 'react'
import { useDataStore } from '../../store/dataStore'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  large?: boolean
}

export function CurrencyInput({ value, onChange, placeholder = '0', className = '', large }: Props) {
  const symbol = useDataStore(s => s.settings.currencySymbol)
  const ref = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.,]/g, '')
    onChange(raw)
  }

  return (
    <div className={`flex items-center gap-1 ${className}`} onClick={() => ref.current?.focus()}>
      <span className={large ? 'text-3xl font-bold text-slate-400' : 'text-base text-slate-400'}>
        {symbol}
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`bg-transparent outline-none w-full ${
          large ? 'text-4xl font-bold text-slate-800' : 'text-base text-slate-800'
        }`}
      />
    </div>
  )
}
