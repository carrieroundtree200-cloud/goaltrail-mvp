import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'warning' | 'critical'

const tones: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  accent: 'border-accent-200 bg-accent-50 text-accent-800',
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  caution: 'border-amber-200 bg-amber-50 text-amber-900',
  warning: 'border-orange-200 bg-orange-50 text-orange-900',
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
}

interface BadgeProps {
  tone?: BadgeTone
  icon?: LucideIcon
  className?: string
  children: ReactNode
}

/**
 * Status is always text plus an icon. Colour is a reinforcement, never the
 * only signal.
 */
export function Badge({ tone = 'neutral', icon: Icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      {children}
    </span>
  )
}
