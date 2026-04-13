import React from 'react'
import * as Icons from 'lucide-react'

interface Props {
  name: string
  color: string
  size?: number
}

export function CategoryIcon({ name, color, size = 20 }: Props) {
  const Icon = (Icons[name as keyof typeof Icons] as React.ComponentType<{ size?: number; style?: React.CSSProperties; strokeWidth?: number }>) ?? Icons.Tag
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ backgroundColor: color + '22', width: size + 16, height: size + 16 }}
    >
      <Icon size={size} style={{ color }} strokeWidth={2} />
    </div>
  )
}
