import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { healthMeta } from '@/components/domain/status'
import type { GoalHealth, HealthReason, ReasonSeverity } from '@/lib/health'

export function HealthBadge({
  level,
  className,
}: {
  level: GoalHealth['level']
  className?: string
}) {
  const meta = healthMeta[level]
  return (
    <Badge tone={meta.tone} icon={meta.icon} className={className}>
      {meta.label}
    </Badge>
  )
}

const bullets: Record<ReasonSeverity, string> = {
  good: 'bg-emerald-500',
  watch: 'bg-amber-500',
  at_risk: 'bg-orange-500',
  blocked: 'bg-rose-600',
}

const severityWords: Record<ReasonSeverity, string> = {
  good: 'Positive',
  watch: 'Watch',
  at_risk: 'At risk',
  blocked: 'Blocked',
}

/**
 * The "why" behind a health rating. Health is never shown as a bare colour —
 * these reasons always travel with it.
 */
export function HealthReasons({
  reasons,
  limit,
  className,
}: {
  reasons: HealthReason[]
  limit?: number
  className?: string
}) {
  const shown = limit ? reasons.slice(0, limit) : reasons

  return (
    <ul className={cn('space-y-2.5', className)}>
      {shown.map((reason) => (
        <li key={reason.id} className="flex gap-2.5">
          <span
            className={cn('mt-1.5 size-2 shrink-0 rounded-full', bullets[reason.severity])}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">
              <span className="sr-only">{severityWords[reason.severity]}: </span>
              {reason.label}
            </p>
            <p className="text-sm text-slate-600">{reason.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
