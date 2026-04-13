import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  fullHeight?: boolean
}

export function BottomSheet({ open, onClose, title, children, fullHeight }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={cn(
          'relative bg-white rounded-t-2xl shadow-2xl animate-slideUp',
          fullHeight ? 'max-h-[92vh]' : 'max-h-[85vh]',
          'flex flex-col'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
