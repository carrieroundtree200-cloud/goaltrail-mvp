import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { taskStatusMeta, taskStatusOrder } from '@/components/domain/status'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useWorkspace } from '@/state/workspace'
import type { Milestone, Person, Task, TaskPriority, TaskStatus } from '@/types'

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical']

const schema = z
  .object({
    title: z.string().trim().min(3, 'Give the task a short, clear name.'),
    detail: z.string().max(600, 'Keep the detail under 600 characters.').optional(),
    status: z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'done']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    ownerId: z.string().min(1, 'Every task needs an owner.'),
    dueDate: z.string().optional(),
    milestoneId: z.string().optional(),
    blockedReason: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.status === 'blocked' && !values.blockedReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['blockedReason'],
        message: 'Say what this task is waiting on so the board explains itself.',
      })
    }
  })

type FormValues = z.infer<typeof schema>

interface TaskDialogProps {
  open: boolean
  onClose: () => void
  goalId: string
  /** Undefined means "create a new task". */
  task?: Task
  people: Person[]
  milestones: Milestone[]
  defaultStatus?: TaskStatus
  defaultOwnerId?: string
  /** Set when the task is being agreed as an action item in a meeting. */
  meetingId?: string
}

export function TaskDialog({
  open,
  onClose,
  goalId,
  task,
  people,
  milestones,
  defaultStatus = 'todo',
  defaultOwnerId,
  meetingId,
}: TaskDialogProps) {
  const { createTask, updateTask, deleteTask } = useWorkspace()
  const editing = Boolean(task)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      detail: '',
      status: defaultStatus,
      priority: 'medium',
      ownerId: defaultOwnerId ?? people[0]?.id ?? '',
      dueDate: '',
      milestoneId: '',
      blockedReason: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      title: task?.title ?? '',
      detail: task?.detail ?? '',
      status: task?.status ?? defaultStatus,
      priority: task?.priority ?? 'medium',
      ownerId: task?.ownerId ?? defaultOwnerId ?? people[0]?.id ?? '',
      dueDate: task?.dueDate ?? '',
      milestoneId: task?.milestoneId ?? '',
      blockedReason: task?.blockedReason ?? '',
    })
  }, [open, task, reset, defaultStatus, defaultOwnerId, people])

  const status = watch('status')

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      goalId,
      title: values.title.trim(),
      detail: values.detail?.trim() || undefined,
      status: values.status,
      priority: values.priority,
      ownerId: values.ownerId,
      dueDate: values.dueDate || undefined,
      milestoneId: values.milestoneId || undefined,
      meetingId: task?.meetingId ?? meetingId,
      blockedReason: values.status === 'blocked' ? values.blockedReason?.trim() : undefined,
    }

    if (task) {
      await updateTask(task.id, payload)
    } else {
      await createTask(payload)
    }
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit task' : 'Add a task'}
      description={
        editing
          ? 'Change the details, move it to another status, or reassign it.'
          : 'Tasks are the work the team does to move the goal. They are not the goal itself.'
      }
      footer={
        <>
          {editing ? (
            <Button
              variant="danger"
              className="mr-auto"
              disabled={isSubmitting}
              onClick={async () => {
                await deleteTask(task!.id)
                onClose()
              }}
            >
              Delete
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="task-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Task" htmlFor="task-title" required error={errors.title?.message}>
          <Input
            id="task-title"
            placeholder="Stage evening loads before the 15:30 cut-off"
            invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </Field>

        <Field
          label="Detail"
          htmlFor="task-detail"
          hint="Optional. Anything the owner needs that the title cannot hold."
          error={errors.detail?.message}
        >
          <Textarea id="task-detail" rows={3} {...register('detail')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="task-status" required error={errors.status?.message}>
            <Select id="task-status" {...register('status')}>
              {taskStatusOrder.map((value) => (
                <option key={value} value={value}>
                  {taskStatusMeta[value].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Priority" htmlFor="task-priority" required error={errors.priority?.message}>
            <Select id="task-priority" {...register('priority')}>
              {priorities.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Owner" htmlFor="task-owner" required error={errors.ownerId?.message}>
            <Select id="task-owner" invalid={Boolean(errors.ownerId)} {...register('ownerId')}>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Due date" htmlFor="task-due" error={errors.dueDate?.message}>
            <Input id="task-due" type="date" {...register('dueDate')} />
          </Field>
        </div>

        <Field
          label="Linked milestone"
          htmlFor="task-milestone"
          hint="Optional. Linking work to a milestone shows how the plan adds up."
        >
          <Select id="task-milestone" {...register('milestoneId')}>
            <option value="">Not linked to a milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.title}
              </option>
            ))}
          </Select>
        </Field>

        {status === 'blocked' ? (
          <Field
            label="What is it waiting on?"
            htmlFor="task-blocked"
            required
            error={errors.blockedReason?.message}
          >
            <Textarea
              id="task-blocked"
              rows={2}
              placeholder="The vendor has not confirmed the time-zone setting can be changed."
              invalid={Boolean(errors.blockedReason)}
              {...register('blockedReason')}
            />
          </Field>
        ) : null}
      </form>
    </Dialog>
  )
}
