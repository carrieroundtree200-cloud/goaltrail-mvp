import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { HealthBadge } from '@/components/domain/HealthBadge'
import { targetMeta } from '@/components/domain/status'
import { describeDeadline } from '@/lib/dates'
import { formatMetricValue, formatPercent } from '@/lib/format'
import { expectedMarkerFraction, progressBarFraction } from '@/lib/metrics'
import type { GoalView } from '@/state/selectors'

const barTone = {
  met: 'positive',
  ahead: 'positive',
  on_pace: 'accent',
  behind: 'caution',
  missed: 'critical',
  not_started: 'accent',
} as const

export function GoalCard({ view }: { view: GoalView }) {
  const { goal, metric, plan, health, owner } = view
  const unit = goal.metric.unit
  const target = targetMeta[metric.status]

  return (
    <article className="card hover:border-accent-300 group relative flex flex-col p-4 transition-colors sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            <Link
              to={`/goals/${goal.id}`}
              className="before:absolute before:inset-0 before:content-['']"
            >
              {goal.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-slate-500">{goal.metric.name}</p>
        </div>
        <HealthBadge level={health.level} />
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatMetricValue(metric.current, unit)}
          </span>
          <span className="text-xs text-slate-500">
            target {formatMetricValue(metric.target, unit)}
          </span>
        </div>
        <Progress
          className="mt-2"
          value={progressBarFraction(metric)}
          tone={barTone[metric.status]}
          label={`${formatPercent(metric.attainment)} of the way from baseline to target`}
          marker={{
            value: expectedMarkerFraction(metric),
            label: `A steady run would be at ${formatMetricValue(metric.expectedNow, unit)} today`,
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge tone={target.tone} icon={target.icon}>
            {target.label}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {describeDeadline(goal.deadline)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        <span className="font-medium text-slate-800">Why {health.level === 'on_track' ? 'on track' : health.level.replaceAll('_', ' ')}: </span>
        {health.headline}.
      </p>

      <div className="border-hairline mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <Avatar person={owner} size="xs" />
          <span className="text-xs text-slate-500">{owner?.name ?? 'Unassigned'}</span>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          Plan {formatPercent(plan.taskCompletion)} · {plan.doneMilestones}/{plan.totalMilestones}{' '}
          milestones
        </span>
      </div>

      <ArrowRight
        aria-hidden="true"
        className="group-hover:text-accent-600 absolute right-4 bottom-4 size-4 text-transparent transition-colors"
      />
    </article>
  )
}
