import { Flag, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { milestoneStatusMeta, taskStatusMeta } from '@/components/domain/status'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/states'
import { describeDueDate, formatDate, isOverdue } from '@/lib/dates'
import { formatPercent } from '@/lib/format'
import { MilestoneDialog } from '@/routes/goal/MilestoneDialog'
import { useGoalView } from '@/routes/goal/context'
import { useWorkspace } from '@/state/workspace'
import type { Milestone } from '@/types'

export function PlanTab() {
  const view = useGoalView()
  const { workspace } = useWorkspace()
  const [dialog, setDialog] = useState<{ open: boolean; milestone?: Milestone }>({ open: false })

  const { milestones, tasks, plan } = view
  const personName = (id: string) =>
    workspace.people.find((person) => person.id === id)?.name ?? 'Unassigned'
  const person = (id: string) => workspace.people.find((candidate) => candidate.id === id)

  const unlinked = tasks.filter((task) => !task.milestoneId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Plan</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-600">
            The checkpoints the team believes will move the metric. Finishing them all is progress
            on the plan — the goal still succeeds or fails on its target.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus aria-hidden="true" className="size-4" />
          Add milestone
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500">Milestones complete</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
            {plan.doneMilestones} of {plan.totalMilestones}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Tasks complete</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
            {plan.doneTasks} of {plan.totalTasks}
          </p>
          <Progress
            className="mt-2"
            value={plan.taskCompletion}
            label={`${formatPercent(plan.taskCompletion)} of tasks complete`}
          />
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Next milestone</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {plan.nextMilestone?.title ?? 'Everything is done'}
          </p>
          {plan.nextMilestone ? (
            <p className="mt-0.5 text-xs text-slate-500">
              {describeDueDate(plan.nextMilestone.dueDate)}
            </p>
          ) : null}
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Flag}
            title="No milestones yet"
            description="Break the goal into a handful of checkpoints so the team can tell whether the plan is on schedule."
            action={
              <Button onClick={() => setDialog({ open: true })}>
                <Plus aria-hidden="true" className="size-4" />
                Add the first milestone
              </Button>
            }
          />
        </div>
      ) : (
        <ol className="space-y-4">
          {milestones.map((milestone, index) => {
            const meta = milestoneStatusMeta[milestone.status]
            const milestoneTasks = tasks.filter((task) => task.milestoneId === milestone.id)
            const done = milestoneTasks.filter((task) => task.status === 'done').length
            const overdue = milestone.status !== 'done' && isOverdue(milestone.dueDate)

            return (
              <li key={milestone.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">{milestone.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{milestone.detail}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Badge tone={meta.tone} icon={meta.icon}>
                          {meta.label}
                        </Badge>
                        <span
                          className={`text-xs ${overdue ? 'font-medium text-rose-700' : 'text-slate-500'}`}
                        >
                          {milestone.status === 'done'
                            ? `Was due ${formatDate(milestone.dueDate)}`
                            : `${formatDate(milestone.dueDate)} · ${describeDueDate(milestone.dueDate)}`}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Avatar person={person(milestone.ownerId)} size="xs" />
                          {personName(milestone.ownerId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDialog({ open: true, milestone })}
                  >
                    <Pencil aria-hidden="true" className="size-3.5" />
                    Edit
                  </Button>
                </div>

                {milestoneTasks.length > 0 ? (
                  <div className="border-hairline mt-4 border-t pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-500">
                        {done} of {milestoneTasks.length} linked tasks done
                      </p>
                      <Link
                        to="../work"
                        className="hover:text-accent-700 text-xs text-slate-500 underline-offset-2 hover:underline"
                      >
                        Open work board
                      </Link>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {milestoneTasks.map((task) => {
                        const state = taskStatusMeta[task.status]
                        return (
                          <li key={task.id} className="flex items-center gap-2 text-sm">
                            <state.icon
                              aria-hidden="true"
                              className="size-3.5 shrink-0 text-slate-400"
                            />
                            <span
                              className={
                                task.status === 'done' ? 'text-slate-500' : 'text-slate-700'
                              }
                            >
                              {task.title}
                            </span>
                            <span className="text-xs text-slate-400">
                              · {state.label} · {personName(task.ownerId)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="border-hairline mt-4 border-t pt-3 text-xs text-slate-500">
                    No tasks linked to this milestone yet.
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {unlinked.length > 0 ? (
        <Section
          title="Work not linked to a milestone"
          description="Useful work that does not yet sit under a checkpoint."
          flush
        >
          <ul className="divide-hairline divide-y">
            {unlinked.map((task) => {
              const state = taskStatusMeta[task.status]
              return (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-5"
                >
                  <span className="text-slate-700">{task.title}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    {personName(task.ownerId)}
                    <Badge tone={state.tone} icon={state.icon}>
                      {state.label}
                    </Badge>
                  </span>
                </li>
              )
            })}
          </ul>
        </Section>
      ) : null}

      <MilestoneDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        goalId={view.goal.id}
        milestone={dialog.milestone}
        people={workspace.people}
      />
    </div>
  )
}
