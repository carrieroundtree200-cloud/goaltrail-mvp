import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { milestoneStatusMeta } from '@/components/domain/status'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useWorkspace } from '@/state/workspace'
import type { Milestone, MilestoneStatus, Person } from '@/types'

const statuses: MilestoneStatus[] = ['not_started', 'in_progress', 'at_risk', 'done']

const schema = z.object({
  title: z.string().trim().min(4, 'Name the milestone.'),
  detail: z.string().trim().min(10, 'Say what has to be true when this milestone is reached.'),
  dueDate: z.string().min(1, 'Pick a date.'),
  status: z.enum(['not_started', 'in_progress', 'at_risk', 'done']),
  ownerId: z.string().min(1, 'Pick an owner.'),
})

type FormValues = z.infer<typeof schema>

export function MilestoneDialog({
  open,
  onClose,
  goalId,
  milestone,
  people,
}: {
  open: boolean
  onClose: () => void
  goalId: string
  milestone?: Milestone
  people: Person[]
}) {
  const { createMilestone, updateMilestone, deleteMilestone } = useWorkspace()
  const editing = Boolean(milestone)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      title: milestone?.title ?? '',
      detail: milestone?.detail ?? '',
      dueDate: milestone?.dueDate ?? '',
      status: milestone?.status ?? 'not_started',
      ownerId: milestone?.ownerId ?? people[0]?.id ?? '',
    })
  }, [open, milestone, people, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (milestone) {
      await updateMilestone(milestone.id, values)
    } else {
      await createMilestone({ goalId, ...values })
    }
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit milestone' : 'Add a milestone'}
      description="Milestones break the plan into checkpoints. They are steps towards the target, not the target itself."
      footer={
        <>
          {editing ? (
            <Button
              variant="danger"
              className="mr-auto"
              disabled={isSubmitting}
              onClick={async () => {
                await deleteMilestone(milestone!.id)
                onClose()
              }}
            >
              Delete
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="milestone-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Add milestone'}
          </Button>
        </>
      }
    >
      <form id="milestone-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Milestone" htmlFor="ms-title" required error={errors.title?.message}>
          <Input
            id="ms-title"
            placeholder="Cut dock dwell time to under 20 minutes"
            invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </Field>

        <Field
          label="What has to be true"
          htmlFor="ms-detail"
          required
          error={errors.detail?.message}
        >
          <Textarea id="ms-detail" rows={3} invalid={Boolean(errors.detail)} {...register('detail')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Due date" htmlFor="ms-due" required error={errors.dueDate?.message}>
            <Input id="ms-due" type="date" invalid={Boolean(errors.dueDate)} {...register('dueDate')} />
          </Field>
          <Field label="Status" htmlFor="ms-status" required>
            <Select id="ms-status" {...register('status')}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {milestoneStatusMeta[status].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Owner" htmlFor="ms-owner" required error={errors.ownerId?.message}>
            <Select id="ms-owner" {...register('ownerId')}>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Dialog>
  )
}
