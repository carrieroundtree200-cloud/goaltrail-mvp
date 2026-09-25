import { Ban, CalendarClock, ListChecks } from 'lucide-react'

import { Progress } from '@/components/ui/Progress'
import { describeDueDate } from '@/lib/dates'
import { formatPercent } from '@/lib/format'
import type { PlanProgress } from '@/lib/plan'

/**
 * Plan progress — how much of the agreed work is finished. Shown next to the
 * target, never instead of it, and always labelled as plan progress.
 */
export function PlanCard({ plan }: { plan: PlanProgress }) {
  return (
    <div className="card h-full p-4 sm:p-5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <ListChecks aria-hidden="true" className="size-3.5" />
        <span>Plan progress</span>
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <span className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {formatPercent(plan.taskCompletion)}
        </span>
        <span className="text-sm text-slate-500">
          {plan.doneTasks} of {plan.totalTasks} tasks done
        </span>
      </div>

      <Progress
        className="mt-4"
        value={plan.taskCompletion}
        tone="accent"
        label={`${plan.doneTasks} of ${plan.totalTasks} tasks complete`}
      />

      <p className="mt-2 text-xs text-slate-500">
        This is how much of the plan is finished. It is not a measure of whether the goal will hit
        its target.
      </p>

      <dl className="border-hairline mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
        <div>
          <dt className="text-xs text-slate-500">Milestones</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums">
            {plan.doneMilestones} of {plan.totalMilestones} done
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">In progress</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums">
            {plan.inProgressTasks} tasks
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarClock aria-hidden="true" className="size-3" /> Overdue
          </dt>
          <dd
            className={`mt-0.5 text-sm font-medium tabular-nums ${
              plan.overdueTasks > 0 ? 'text-amber-800' : 'text-slate-900'
            }`}
          >
            {plan.overdueTasks} tasks
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-slate-500">
            <Ban aria-hidden="true" className="size-3" /> Blocked
          </dt>
          <dd
            className={`mt-0.5 text-sm font-medium tabular-nums ${
              plan.blockedTasks > 0 ? 'text-rose-800' : 'text-slate-900'
            }`}
          >
            {plan.blockedTasks} tasks
          </dd>
        </div>
      </dl>

      {plan.nextMilestone ? (
        <div className="border-hairline mt-4 border-t pt-3">
          <p className="text-xs text-slate-500">Next milestone</p>
          <p className="mt-0.5 text-sm font-medium text-slate-900">{plan.nextMilestone.title}</p>
          <p className="text-xs text-slate-500">{describeDueDate(plan.nextMilestone.dueDate)}</p>
        </div>
      ) : null}
    </div>
  )
}
