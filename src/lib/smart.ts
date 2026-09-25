import { daysUntil, formatDate } from '@/lib/dates'
import { formatMetricValue } from '@/lib/format'
import type { Goal } from '@/types'

/** A goal draft is everything needed to describe the goal, before it has an id. */
export type GoalLike = Pick<
  Goal,
  'title' | 'purpose' | 'beneficiary' | 'metric' | 'startDate' | 'deadline'
>

/** One sentence a person can read aloud in a meeting. */
export function smartStatement(goal: GoalLike, ownerName?: string): string {
  const { metric } = goal
  const verb = metric.direction === 'increase' ? 'Increase' : 'Reduce'
  const owner = ownerName ? `, owned by ${ownerName}` : ''
  return `${verb} ${metric.name.toLowerCase()} from ${formatMetricValue(metric.baseline, metric.unit)} to ${formatMetricValue(metric.target, metric.unit)} by ${formatDate(goal.deadline)}${owner}.`
}

export interface SmartPart {
  letter: string
  label: string
  text: string
}

/** The five SMART checks, each answered with the goal's own wording. */
export function smartBreakdown(goal: GoalLike, ownerName?: string): SmartPart[] {
  const { metric } = goal
  const days = daysUntil(goal.deadline)
  const move = Math.abs(metric.target - metric.baseline)

  return [
    {
      letter: 'S',
      label: 'Specific',
      text: goal.title,
    },
    {
      letter: 'M',
      label: 'Measurable',
      text: `${metric.name}, measured from ${metric.source || 'a source you name'}, read ${metric.cadence}. Baseline ${formatMetricValue(metric.baseline, metric.unit)}, target ${formatMetricValue(metric.target, metric.unit)}.`,
    },
    {
      letter: 'A',
      label: 'Achievable',
      text: `A move of ${formatMetricValue(move, metric.unit)} over ${Math.max(days, 0)} days${ownerName ? `, with ${ownerName} accountable` : ''}. Check this against what the team has managed before.`,
    },
    {
      letter: 'R',
      label: 'Relevant',
      text: goal.purpose || 'Explain why this matters and who feels the difference.',
    },
    {
      letter: 'T',
      label: 'Time-bound',
      text: `Starts ${formatDate(goal.startDate)} and must be met by ${formatDate(goal.deadline)}${days >= 0 ? ` — ${days} days from today` : ''}.`,
    },
  ]
}
