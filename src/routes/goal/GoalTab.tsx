import { Pencil, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/states'
import { formatDate } from '@/lib/dates'
import { formatMetricValue } from '@/lib/format'
import { smartBreakdown, smartStatement } from '@/lib/smart'
import { GoalDialog } from '@/routes/goal/GoalDialog'
import { MeasurementDialog } from '@/routes/goal/MeasurementDialog'
import { useGoalView } from '@/routes/goal/context'
import { useWorkspace } from '@/state/workspace'

const cadenceWords = {
  daily: 'every day',
  weekly: 'every week',
  biweekly: 'every two weeks',
  monthly: 'every month',
}

export function GoalTab() {
  const view = useGoalView()
  const { workspace } = useWorkspace()
  const [editing, setEditing] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const { goal, owner, sponsor, readings } = view

  const unit = goal.metric.unit
  const parts = smartBreakdown(goal, owner?.name)

  const orderedReadings = [...readings].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Section
        className="xl:col-span-2"
        title="The goal"
        description="What success means, in the team's own words."
        action={
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="size-3.5" />
            Edit
          </Button>
        }
      >
        <div className="border-accent-200 bg-accent-50 rounded-xl border px-4 py-3">
          <p className="text-accent-900 flex items-start gap-2 text-sm font-medium">
            <Sparkles aria-hidden="true" className="text-accent-600 mt-0.5 size-4 shrink-0" />
            {smartStatement(goal, owner?.name)}
          </p>
        </div>

        <dl className="mt-5 space-y-4">
          <div>
            <dt className="text-xs font-medium text-slate-500">Why it matters</dt>
            <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-slate-700">
              {goal.purpose}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Who feels the difference</dt>
            <dd className="mt-1 text-sm text-slate-700">{goal.beneficiary}</dd>
          </div>
        </dl>

        <div className="border-hairline mt-5 border-t pt-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            SMART check
          </h3>
          <ul className="mt-3 space-y-3">
            {parts.map((part) => (
              <li key={part.letter} className="flex gap-3">
                <span className="bg-accent-100 text-accent-800 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                  {part.letter}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{part.label}</p>
                  <p className="text-sm text-slate-600">{part.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <div className="space-y-6">
        <Section title="How it is measured">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Metric</dt>
              <dd className="text-right font-medium text-slate-900">{goal.metric.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Direction</dt>
              <dd className="text-right font-medium text-slate-900">
                {goal.metric.direction === 'increase' ? 'Higher is better' : 'Lower is better'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Baseline</dt>
              <dd className="text-right font-medium text-slate-900 tabular-nums">
                {formatMetricValue(goal.metric.baseline, unit)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Target</dt>
              <dd className="text-right font-medium text-slate-900 tabular-nums">
                {formatMetricValue(goal.metric.target, unit)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Read</dt>
              <dd className="text-right font-medium text-slate-900">
                {cadenceWords[goal.metric.cadence]}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Source</dt>
              <dd className="mt-1 text-slate-700">{goal.metric.source}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Dates and people">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Started</dt>
              <dd className="font-medium text-slate-900">{formatDate(goal.startDate)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Deadline</dt>
              <dd className="font-medium text-slate-900">{formatDate(goal.deadline)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Owner</dt>
              <dd className="flex items-center gap-2">
                <Avatar person={owner} size="xs" />
                <span className="font-medium text-slate-900">{owner?.name ?? 'Unassigned'}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Sponsor</dt>
              <dd className="flex items-center gap-2">
                {sponsor ? <Avatar person={sponsor} size="xs" /> : null}
                <span className="font-medium text-slate-900">{sponsor?.name ?? 'None'}</span>
              </dd>
            </div>
          </dl>
          {goal.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {goal.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}
        </Section>
      </div>

      <Section
        className="xl:col-span-3"
        title="Measurements"
        description="Every reading recorded against this goal, newest first."
        action={
          <Button variant="secondary" size="sm" onClick={() => setMeasuring(true)}>
            <Plus aria-hidden="true" className="size-3.5" />
            Record measurement
          </Button>
        }
        flush
      >
        {orderedReadings.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No measurements yet"
            description="Record the first reading so the team can see whether the number is moving."
            action={
              <Button size="sm" onClick={() => setMeasuring(true)}>
                Record measurement
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl text-sm">
              <thead>
                <tr className="border-hairline border-b text-left text-xs font-medium text-slate-500">
                  <th scope="col" className="px-4 py-2.5 sm:px-5">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Value
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Recorded by
                  </th>
                  <th scope="col" className="px-4 py-2.5 sm:px-5">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-hairline divide-y">
                {orderedReadings.map((reading) => (
                  <tr key={reading.id}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-700 sm:px-5">
                      {formatDate(reading.date)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-900 tabular-nums">
                      {formatMetricValue(reading.value, unit)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                      {workspace.people.find((person) => person.id === reading.recordedById)?.name ??
                        'Unknown'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 sm:px-5">{reading.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <GoalDialog
        goal={goal}
        people={workspace.people}
        open={editing}
        onClose={() => setEditing(false)}
      />
      <MeasurementDialog goal={goal} open={measuring} onClose={() => setMeasuring(false)} />
    </div>
  )
}
