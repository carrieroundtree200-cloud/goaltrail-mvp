import { CalendarClock, Flag, MoveRight, Pencil } from 'lucide-react'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Menu } from '@/components/ui/Menu'
import { priorityMeta, taskStatusMeta, taskStatusOrder } from '@/components/domain/status'
import { cn } from '@/lib/cn'
import { describeDueDate, isOverdue } from '@/lib/dates'
import type { Milestone, Person, Task, TaskStatus } from '@/types'

interface TaskCardProps {
  task: Task
  owner?: Person
  milestone?: Milestone
  onEdit: (task: Task) => void
  onChangeStatus: (task: Task, status: TaskStatus) => void
}

export function TaskCard({ task, owner, milestone, onEdit, onChangeStatus }: TaskCardProps) {
  const priority = priorityMeta[task.priority]
  const overdue = task.status !== 'done' && isOverdue(task.dueDate)

  return (
    <article className="border-hairline rounded-xl border bg-white p-3 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <h4
          className={cn(
            'text-sm leading-snug font-medium',
            task.status === 'done' ? 'text-slate-500' : 'text-slate-900',
          )}
        >
          {task.title}
        </h4>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Edit {task.title}</span>
          </button>
          <Menu
            label={`Change status of ${task.title}`}
            trigger={<MoveRight aria-hidden="true" className="size-3.5" />}
            triggerClassName="px-1 py-1"
            items={taskStatusOrder.map((status) => ({
              id: status,
              label: taskStatusMeta[status].label,
              icon: taskStatusMeta[status].icon,
              selected: status === task.status,
              onSelect: () => onChangeStatus(task, status),
            }))}
          />
        </div>
      </div>

      {task.status === 'blocked' && task.blockedReason ? (
        <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-900">
          <span className="font-medium">Waiting on: </span>
          {task.blockedReason}
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge tone={priority.tone} icon={priority.icon}>
          {priority.label}
        </Badge>
        {task.dueDate ? (
          <Badge tone={overdue ? 'critical' : 'neutral'} icon={CalendarClock}>
            {describeDueDate(task.dueDate)}
          </Badge>
        ) : (
          <Badge tone="neutral" icon={CalendarClock}>
            No due date
          </Badge>
        )}
        {milestone ? (
          <Badge tone="accent" icon={Flag}>
            {milestone.title}
          </Badge>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <Avatar person={owner} size="xs" />
        <span className="truncate text-xs text-slate-500">{owner?.name ?? 'Unassigned'}</span>
      </div>
    </article>
  )
}
