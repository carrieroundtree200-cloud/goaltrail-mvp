import { Ban, CalendarClock, Gauge, Plus, Target, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ActivityFeed } from '@/components/domain/ActivityFeed'
import { AttentionList } from '@/components/domain/AttentionList'
import { GoalCard } from '@/components/domain/GoalCard'
import { HealthBadge } from '@/components/domain/HealthBadge'
import { StatTile } from '@/components/domain/StatTile'
import { targetMeta } from '@/components/domain/status'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { EmptyState, ErrorState, LoadingPanel, Skeleton } from '@/components/ui/states'
import { buildAttentionRows } from '@/lib/attention'
import { describeDeadline, formatDate } from '@/lib/dates'
import { formatMetricValue, formatPercent, pluralize } from '@/lib/format'
import { selectAllGoalViews } from '@/state/selectors'
import { useWorkspace } from '@/state/workspace'

export function Dashboard() {
  const { status, error, workspace, currentUser, reload } = useWorkspace()

  if (status === 'loading') {
    return (
      <Page>
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <LoadingPanel label="Loading your goals" />
      </Page>
    )
  }

  if (status === 'error') {
    return (
      <Page>
        <ErrorState
          title="We could not load the workspace"
          message={error ?? 'Browser storage may be unavailable.'}
          onRetry={() => void reload()}
        />
      </Page>
    )
  }

  const views = selectAllGoalViews(workspace)
  const attention = buildAttentionRows(views, workspace.people)

  const onTargetPace = views.filter((view) =>
    ['met', 'ahead', 'on_pace'].includes(view.metric.status),
  ).length
  const needAttention = views.filter((view) =>
    ['at_risk', 'blocked'].includes(view.health.level),
  ).length
  const openBlockers = views.reduce((total, view) => total + view.items.openBlockers.length, 0)
  const overdueTasks = views.reduce((total, view) => total + view.plan.overdueTasks, 0)

  const firstName = currentUser?.name.split(' ')[0] ?? 'there'

  return (
    <Page className="space-y-6">
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description={
          views.length > 0
            ? `You have ${pluralize(views.length, 'active goal')}. ${onTargetPace} of them are moving at or above the pace needed to hit their target.`
            : 'Create your first goal to start tracking a real-world target.'
        }
        actions={
          <ButtonLink to="/goals/new">
            <Plus aria-hidden="true" className="size-4" />
            New goal
          </ButtonLink>
        }
      />

      {views.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="A goal in GoalTrail is a real-world number you are trying to move by a date. Start with the number, then build the plan around it."
            action={
              <ButtonLink to="/goals/new">
                <Plus aria-hidden="true" className="size-4" />
                Create a goal
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={Gauge}
              label="Goals at or above target pace"
              value={`${onTargetPace} of ${views.length}`}
              hint="Based on the metric, not on task completion"
            />
            <StatTile
              icon={TriangleAlert}
              label="Goals needing attention"
              value={needAttention}
              hint="Health is At risk or Blocked"
              tone={needAttention > 0 ? 'attention' : 'default'}
            />
            <StatTile
              icon={Ban}
              label="Open blockers"
              value={openBlockers}
              hint="Work that cannot move without help"
              tone={openBlockers > 0 ? 'attention' : 'default'}
            />
            <StatTile
              icon={CalendarClock}
              label="Overdue tasks"
              value={overdueTasks}
              hint="Across every goal"
              tone={overdueTasks > 0 ? 'attention' : 'default'}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Section
              className="xl:col-span-2"
              title="Target performance"
              description="Whether each goal's real-world number is on course. Plan progress is shown separately."
              flush
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-3xl text-sm">
                  <thead>
                    <tr className="border-hairline border-b text-left text-xs font-medium text-slate-500">
                      <th scope="col" className="px-4 py-2.5 sm:px-5">
                        Goal and metric
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Current
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Target
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Baseline
                      </th>
                      <th scope="col" className="px-3 py-2.5">
                        Deadline
                      </th>
                      <th scope="col" className="px-4 py-2.5 sm:px-5">
                        Health
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-hairline divide-y">
                    {views.map((view) => {
                      const unit = view.goal.metric.unit
                      const target = targetMeta[view.metric.status]
                      return (
                        <tr key={view.goal.id} className="align-top">
                          <td className="px-4 py-3 sm:px-5">
                            <Link
                              to={`/goals/${view.goal.id}`}
                              className="hover:text-accent-700 font-medium text-slate-900"
                            >
                              {view.goal.title}
                            </Link>
                            <p className="mt-0.5 text-xs text-slate-500">{view.goal.metric.name}</p>
                            <Badge tone={target.tone} icon={target.icon} className="mt-1.5">
                              {target.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                            {formatMetricValue(view.metric.current, unit)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700 tabular-nums">
                            {formatMetricValue(view.metric.target, unit)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-500 tabular-nums">
                            {formatMetricValue(view.metric.baseline, unit)}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {formatDate(view.goal.deadline)}
                            <p className="mt-0.5 text-xs text-slate-500">
                              {describeDeadline(view.goal.deadline)}
                            </p>
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            <HealthBadge level={view.health.level} />
                            <p className="mt-1.5 max-w-52 text-xs text-slate-600">
                              {view.health.headline}
                            </p>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="Plan progress"
              description="How much of the agreed work is finished. Finishing the plan does not by itself mean the goal succeeded."
            >
              <ul className="space-y-4">
                {views.map((view) => (
                  <li key={view.goal.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <Link
                        to={`/goals/${view.goal.id}/plan`}
                        className="hover:text-accent-700 truncate text-sm font-medium text-slate-800"
                      >
                        {view.goal.title}
                      </Link>
                      <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                        {formatPercent(view.plan.taskCompletion)}
                      </span>
                    </div>
                    <Progress
                      className="mt-1.5"
                      value={view.plan.taskCompletion}
                      label={`${view.plan.doneTasks} of ${view.plan.totalTasks} tasks done for ${view.goal.title}`}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {view.plan.doneTasks}/{view.plan.totalTasks} tasks ·{' '}
                      {view.plan.doneMilestones}/{view.plan.totalMilestones} milestones
                      {view.plan.overdueTasks > 0 ? ` · ${view.plan.overdueTasks} overdue` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Section
              className="xl:col-span-2"
              title="Needs attention"
              description="Overdue work, anything blocked, and high-impact risks still open."
              action={
                attention.length > 6 ? (
                  <span className="text-xs text-slate-500">
                    Showing 6 of {attention.length}
                  </span>
                ) : null
              }
              flush
            >
              <AttentionList rows={attention} />
            </Section>

            <Section
              title="Recent activity"
              description="The last things that happened across every goal."
              flush
            >
              <ActivityFeed
                events={workspace.activity}
                people={workspace.people}
                goals={workspace.goals}
                limit={8}
              />
            </Section>
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Your goals</h2>
              <p className="text-xs text-slate-500">
                Each card shows the target, the health reason, and plan progress separately.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {views.map((view) => (
                <GoalCard key={view.goal.id} view={view} />
              ))}
            </div>
          </section>
        </>
      )}
    </Page>
  )
}