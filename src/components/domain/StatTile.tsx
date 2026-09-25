import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: LucideIcon
  tone?: 'default' | 'attention'
  className?: string
}

/** A plain number with a plain label. Deliberately not a chart. */
export function StatTile({ label, value, hint, icon: Icon, tone = 'default', className }: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        tone === 'attention' ? 'border-amber-200 bg-amber-50/60' : 'border-hairline bg-white',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
