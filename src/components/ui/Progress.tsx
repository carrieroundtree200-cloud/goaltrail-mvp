import { cn } from '@/lib/cn'
import { clamp01 } from '@/lib/dates'

interface ProgressProps {
  /** 0–1. */
  value: number
  label: string
  /** Optional second marker, e.g. where a steady run would be today. */
  marker?: { value: number; label: string }
  tone?: 'accent' | 'positive' | 'caution' | 'critical'
  className?: string
}

const tones = {
  accent: 'bg-accent-600',
  positive: 'bg-emerald-600',
  caution: 'bg-amber-500',
  critical: 'bg-rose-600',
}

export function Progress({ value, label, marker, tone = 'accent', className }: ProgressProps) {
  const percent = clamp01(value) * 100
  return (
    <div
      className={cn('relative h-2.5 w-full overflow-visible rounded-full bg-slate-200', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={label}
    >
      <div
        className={cn('h-2.5 rounded-full transition-[width] duration-500', tones[tone])}
        style={{ width: `${percent}%` }}
      />
      {marker ? (
        <span
          className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-slate-500"
          style={{ left: `calc(${clamp01(marker.value) * 100}% - 1px)` }}
          title={marker.label}
        >
          <span className="sr-only">{marker.label}</span>
        </span>
      ) : null}
    </div>
  )
}
