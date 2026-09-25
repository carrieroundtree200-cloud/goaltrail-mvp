import { CalendarDays, Flag, Target } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { targetMeta } from '@/components/domain/status'
import { describeDeadline, formatDate } from '@/lib/dates'
import { formatMetricDelta, formatMetricValue, formatPercent } from '@/lib/format'
import { expectedMarkerFraction, progressBarFraction, type MetricSnapshot } from '@/lib/metrics'
import type { Goal } from '@/types'

const barTone = {
  met: 'positive',
  ahead: 'positive',
  on_pace: 'accent',
  behind: 'caution',
  missed: 'critical',
  not_started: 'accent',
} as const

/**
 * Target performance — the only thing that decides whether the goal succeeded.
 */
export function TargetCard({ goal, metric }: { goal: Goal; metric: MetricSnapshot }) {
  const unit = goal.metric.unit
  const meta = targetMeta[metric.status]

  return (
    <div className="card h-full p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Target aria-hidden="true" className="size-3.5" />
            <span>Target performance</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{goal.metric.name}</p>
        </div>
        <Badge tone={meta.tone} icon={meta.icon}>
          {meta.label}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {formatMetricValue(metric.current, unit)}
        </span>
        <span className="text-sm text-slate-500">
          target {formatMetricValue(metric.target, unit)} by {formatDate(goal.deadline)}
        </span>
      </div>

      <div className="mt-4">
        <Progress
          value={progressBarFraction(metric)}
          tone={barTone[metric.status]}
          label={`${formatPercent(metric.attainment)} of the distance from baseline to target`}
          marker={{
            value: expectedMarkerFraction(metric),
            label: `A steady run to target would be at ${formatMetricValue(metric.expectedNow, unit)} today`,
          }}
        />
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            Baseline {formatMetricValue(metric.baseline, unit)} on {formatDate(goal.startDate)}
          </span>
          <span className="tabular-nums">
            {formatPercent(metric.attainment)} of the way there
          </span>
        </div>
      </div>

      <dl className="border-hairline mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">Since baseline</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums">
            {formatMetricDelta(
              goal.metric.direction === 'increase'
                ? metric.changeSinceBaseline
                : -metric.changeSinceBaseline,
              unit,
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Steady run would be</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums">
            {formatMetricValue(metric.expectedNow, unit)}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-slate-500">
            <Flag aria-hidden="true" className="size-3" /> Still to cover
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums">
            {formatMetricValue(metric.remaining, unit)}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays aria-hidden="true" className="size-3" /> Deadline
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900">
            {describeDeadline(goal.deadline)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-slate-500">
        <span className="font-medium">Where this number comes from: </span>
        {goal.metric.source}.
      </p>
    </div>
  )
}
