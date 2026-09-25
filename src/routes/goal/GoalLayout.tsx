import { CalendarDays, Plus, Target, UserRound } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'

import { HealthBadge } from '@/components/domain/HealthBadge'
import { targetMeta } from '@/components/domain/status'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ErrorState, LoadingPanel } from '@/components/ui/states'
import { cn } from '@/lib/cn'
import { describeDeadline, formatDate } from '@/lib/dates'
import { selectGoalView } from '@/state/selectors'
import { useWorkspace } from '@/state/workspace'
import { MeasurementDialog } from '@/routes/goal/MeasurementDialog'

const tabs = [
  { to: '.', label: 'Overview', end: true },
  { to: 'goal', label: 'Goal' },
  { to: 'plan', label: 'Plan' },
  { to: 'work', label: 'Work board' },
  { to: 'people', label: 'People' },
  { to: 'meetings', label: 'Meetings' },
  { to: 'risks', label: 'Risks & changes' },
  { to: 'files', label: 'Files' },
]

export function GoalLayout() {
  const { goalId = '' } = useParams()
  const { status, error, workspace, reload } = useWorkspace()
  const [measuring, setMeasuring] = useState(false)

  if (status === 'loading') {
    return (
      <Page>
        <LoadingPanel label="Loading this goal" />
      </Page>
    )
  }

  if (status === 'error') {
    return (
      <Page>
        <ErrorState message={error ?? 'Unknown error'} onRetry={() => void reload()} />
      </Page>
    )
  }

  const view = selectGoalView(workspace, goalId)

  if (!view) {
    return (
      <Page>
        <ErrorState
          title="Goal not found"
          message="This goal may have been removed, or the link is out of date."
        />
        <div className="mt-4 flex justify-center">
          <ButtonLink to="/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
        </div>
      </Page>
    )
  }

  const { goal, metric, owner, health } = view
  const target = targetMeta[metric.status]

  return (
    <>
      <div className="border-hairline border-b bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
          <PageHeader
            eyebrow={
              <>
                <HealthBadge level={health.level} />
                <Badge tone={target.tone} icon={target.icon}>
                  {target.label}
                </Badge>
                {goal.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </>
            }
            title={goal.title}
            description={
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Target aria-hidden="true" className="size-4 text-slate-400" />
                  {goal.metric.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <UserRound aria-hidden="true" className="size-4 text-slate-400" />
                  {owner?.name ?? 'Unassigned'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="size-4 text-slate-400" />
                  {formatDate(goal.deadline)} · {describeDeadline(goal.deadline)}
                </span>
              </div>
            }
            actions={
              <>
                <Button variant="secondary" onClick={() => setMeasuring(true)}>
                  <Plus aria-hidden="true" className="size-4" />
                  Record measurement
                </Button>
                <ButtonLink to="meetings?new=1">
                  <Plus aria-hidden="true" className="size-4" />
                  Log a meeting
                </ButtonLink>
              </>
            }
          />

          <nav aria-label="Goal sections" className="scrollbar-slim -mb-px mt-5 overflow-x-auto">
            <ul className="flex min-w-max gap-1">
              {tabs.map((tab) => (
                <li key={tab.label}>
                  <NavLink
                    to={tab.to}
                    end={tab.end}
                    className={({ isActive }) =>
                      cn(
                        'inline-block border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                        isActive
                          ? 'border-accent-600 text-accent-800'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
                      )
                    }
                  >
                    {tab.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <Page>
        <Outlet context={view} />
      </Page>

      <MeasurementDialog goal={goal} open={measuring} onClose={() => setMeasuring(false)} />
    </>
  )
}
