import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gavel,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { HealthBadge, HealthReasons } from '@/components/domain/HealthBadge'
import { MetricHistory } from '@/components/domain/MetricHistory'
import { PlanCard } from '@/components/domain/PlanCard'
import { TargetCard } from '@/components/domain/TargetCard'
import {
  impactMeta,
  itemKindMeta,
  itemStatusMeta,
  priorityMeta,
  taskStatusMeta,
} from '@/components/domain/status'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/states'
import { describeDueDate, formatDate } from '@/lib/dates'
import { sortByUrgency } from '@/lib/plan'
import { useGoalView } from '@/routes/goal/context'
import { useWorkspace } from '@/state/workspace'
import { healthLabel } from '@/lib/health'

export function OverviewTab() {
  const view = useGoalView()
  const { workspace } = useWorkspace()
  const { goal, metric, plan, health, items, tasks, latestMeeting, decisions } = view

  const personName = (id: string) =>
    workspace.people.find((person) => person.id === id)?.name ?? 'Unassigned'
  const person = (id: string) => workspace.people.find((candidate) => candidate.id === id)

  const immediateWork = sortByUrgency(
    tasks.filter((task) => task.status === 'in_progress' || task.status === 'blocked'),
  ).slice(0, 5)

  const openItems = [...items.openBlockers, ...items.openRisks].slice(0, 5)

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <TargetCard goal={goal} metric={metric} />
      </div>
      <PlanCard plan={plan} />

      <Section
        className="xl:col-span-2"
        title={`Why this goal is ${healthLabel[health.level].toLowerCase()}`}
        description="Health combines how the target is tracking with what is getting in the way."
        action={<HealthBadge level={health.level} />}
      >
        <HealthReasons reasons={health.reasons} />

        <div className="bg-canvas mt-5 grid gap-3 rounded-xl p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-slate-700">1. Target performance</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Where {goal.metric.name.toLowerCase()} stands against the target. This is what decides
              success.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">2. Plan progress</p>
            <p className="mt-0.5 text-xs text-slate-600">
              How much of the agreed work is finished. Useful, but not the same as success.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">3. Goal health</p>
            <p className="mt-0.5 text-xs text-slate-600">
              A judgement on whether the goal is likely to land, with the reasons attached.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Open blockers and risks"
        description={`${items.openBlockers.length} blockers · ${items.openRisks.length} risks · ${items.openChanges.length} changes`}
        action={
          <ButtonLink to={`/goals/${goal.id}/risks`} variant="ghost" size="sm">
            View all
          </ButtonLink>
        }
        flush
      >
        {openItems.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing open"
            description="No blockers or risks are waiting on anyone right now."
          />
        ) : (
          <ul className="divide-hairline divide-y">
            {openItems.map((item) => {
              const kind = itemKindMeta[item.kind]
              const impact = impactMeta[item.impact]
              const state = itemStatusMeta[item.status]
              return (
                <li key={item.id} className="px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={kind.tone} icon={kind.icon}>
                      {kind.label}
                    </Badge>
                    <Badge tone={impact.tone} icon={impact.icon}>
                      {impact.label}
                    </Badge>
                    <Badge tone={state.tone} icon={state.icon}>
                      {state.label}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {personName(item.ownerId)}
                    {item.dueDate ? ` · ${describeDueDate(item.dueDate)}` : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section
        className="xl:col-span-2"
        title="Metric history"
        description={`Every reading of ${goal.metric.name.toLowerCase()} since the goal started.`}
        action={
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp aria-hidden="true" className="size-3.5" />
            {metric.history.length} readings
          </span>
        }
      >
        <MetricHistory goal={goal} metric={metric} />
      </Section>

      <Section
        title="Latest meeting"
        action={
          <ButtonLink to={`/goals/${goal.id}/meetings`} variant="ghost" size="sm">
            All meetings
          </ButtonLink>
        }
      >
        {latestMeeting ? (
          <div>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatDate(latestMeeting.date)} · {latestMeeting.durationMinutes} min
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">
              <Link to={`/meetings/${latestMeeting.id}`} className="hover:text-accent-700">
                {latestMeeting.title}
              </Link>
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800">What changed: </span>
              {latestMeeting.whatChanged}
            </p>
            <div className="mt-3 flex -space-x-1.5">
              {latestMeeting.attendeeIds.slice(0, 6).map((id) => (
                <Avatar key={id} person={person(id)} size="xs" className="ring-2 ring-white" />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No meetings yet"
            description="Log a meeting to connect what the team discussed to this goal."
            action={
              <ButtonLink to={`/goals/${goal.id}/meetings?new=1`} size="sm">
                Log a meeting
              </ButtonLink>
            }
          />
        )}
      </Section>

      <Section
        className="xl:col-span-2"
        title="Immediate work"
        description="What is in progress or blocked right now, most urgent first."
        action={
          <ButtonLink to={`/goals/${goal.id}/work`} variant="ghost" size="sm">
            Work board
          </ButtonLink>
        }
        flush
      >
        {immediateWork.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nothing in flight"
            description="No tasks are in progress or blocked. Pick the next item up from the board."
            action={
              <ButtonLink to={`/goals/${goal.id}/work`} size="sm">
                Open the work board
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-hairline divide-y">
            {immediateWork.map((task) => {
              const state = taskStatusMeta[task.status]
              const priority = priorityMeta[task.priority]
              return (
                <li
                  key={task.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {personName(task.ownerId)} · {describeDueDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge tone={priority.tone} icon={priority.icon}>
                      {priority.label}
                    </Badge>
                    <Badge tone={state.tone} icon={state.icon}>
                      {state.label}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section
        title="Recent decisions"
        description="Choices the team has made and what each one changed."
      >
        {decisions.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No decisions recorded"
            description="Decisions made in a meeting show up here so nobody has to remember them."
          />
        ) : (
          <ul className="space-y-4">
            {decisions.slice(0, 4).map((decision) => (
              <li key={decision.id}>
                <p className="text-sm font-medium text-slate-900">{decision.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {personName(decision.decidedById)} · {formatDate(decision.date)}
                </p>
                <p className="mt-1 text-sm text-slate-600">{decision.consequence}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {items.highImpactOpen.length > 0 ? (
        <div className="xl:col-span-3">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <ShieldAlert aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-amber-700" />
            <p className="text-sm text-amber-900">
              <span className="font-medium">
                {items.highImpactOpen.length} high-impact {items.highImpactOpen.length === 1 ? 'item is' : 'items are'} still open.
              </span>{' '}
              These carry the most weight in this goal&rsquo;s health rating.{' '}
              <Link to={`/goals/${goal.id}/risks`} className="font-medium underline underline-offset-2">
                Review them
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
