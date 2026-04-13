interface Props {
  title: string
  right?: React.ReactNode
  subtitle?: string
}

export function PageHeader({ title, right, subtitle }: Props) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-slate-100">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
