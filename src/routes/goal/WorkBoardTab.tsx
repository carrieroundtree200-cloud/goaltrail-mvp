import { ClipboardList, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { TaskCard } from '@/components/domain/TaskCard'
import { taskStatusMeta, taskStatusOrder } from '@/components/domain/status'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/states'
import { sortByUrgency } from '@/lib/plan'
import { useGoalView } from '@/routes/goal/context'
import { TaskDialog } from '@/routes/goal/TaskDialog'
import { useWorkspace } from '@/state/workspace'
import type { Task, TaskStatus } from '@/types'

export function WorkBoardTab() {
  const view = useGoalView()
  const { workspace, updateTask } = useWorkspace()
  const [dialog, setDialog] = useState<{ open: boolean; task?: Task; status?: TaskStatus }>({
    open: false,
  })
  const [ownerFilter, setOwnerFilter] = useState('all')

  const teamPeople = useMemo(
    () =>
      view.members
        .map((member) => member.person)
        .filter((person): person is NonNullable<typeof person> => Boolean(person)),
    [view.members],
  )

  const visibleTasks = useMemo(
    () =>
      ownerFilter === 'all'
        ? view.tasks
        : view.tasks.filter((task) => task.ownerId === ownerFilter),
    [view.tasks, ownerFilter],
  )

  const columns = taskStatusOrder.map((status) => ({
    status,
    meta: taskStatusMeta[status],
    tasks: sortByUrgency(visibleTasks.filter((task) => task.status === status)),
  }))

  async function changeStatus(task: Task, status: TaskStatus) {
    if (status === task.status) return
    if (status === 'blocked' && !task.blockedReason) {
      setDialog({ open: true, task: { ...task, status } })
      return
    }
    await updateTask(task.id, { status })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Work board</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            The work the team has agreed to do. Use the arrow on a card to move it between
            statuses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="owner-filter" className="text-sm text-slate-600">
            Owner
          </label>
          <Select
            id="owner-filter"
            className="w-auto"
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
          >
            <option value="all">Everyone</option>
            {teamPeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
          <Button onClick={() => setDialog({ open: true })}>
            <Plus aria-hidden="true" className="size-4" />
            Add task
          </Button>
        </div>
      </div>

      {view.tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No work on the board yet"
            description="Add the first task the team needs to do to move this goal's metric."
            action={
              <Button onClick={() => setDialog({ open: true })}>
                <Plus aria-hidden="true" className="size-4" />
                Add task
              </Button>
            }
          />
        </div>
      ) : (
        <div className="scrollbar-slim -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-6xl grid-cols-5 gap-4">
            {columns.map((column) => (
              <section key={column.status} className="flex min-w-0 flex-col">
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <column.meta.icon aria-hidden="true" className="size-4 text-slate-500" />
                    {column.meta.label}
                  </h3>
                  <Badge tone="neutral">{column.tasks.length}</Badge>
                </header>

                <div className="bg-canvas border-hairline flex-1 space-y-2.5 rounded-xl border p-2.5">
                  {column.tasks.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-slate-500">
                      Nothing in {column.meta.label.toLowerCase()}
                    </p>
                  ) : (
                    column.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        owner={workspace.people.find((person) => person.id === task.ownerId)}
                        milestone={view.milestones.find(
                          (milestone) => milestone.id === task.milestoneId,
                        )}
                        onEdit={(selected) => setDialog({ open: true, task: selected })}
                        onChangeStatus={(selected, status) => void changeStatus(selected, status)}
                      />
                    ))
                  )}

                  <button
                    type="button"
                    onClick={() => setDialog({ open: true, status: column.status })}
                    className="hover:border-accent-400 hover:text-accent-700 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2 py-2 text-xs font-medium text-slate-500"
                  >
                    <Plus aria-hidden="true" className="size-3.5" />
                    Add to {column.meta.label.toLowerCase()}
                  </button>
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <TaskDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        goalId={view.goal.id}
        task={dialog.task}
        people={teamPeople.length > 0 ? teamPeople : workspace.people}
        milestones={view.milestones}
        defaultStatus={dialog.status ?? 'todo'}
      />
    </div>
  )
}
