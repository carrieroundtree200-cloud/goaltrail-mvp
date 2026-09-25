import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { numericField } from '@/lib/validation'
import { useWorkspace } from '@/state/workspace'
import type { Goal, Person } from '@/types'

const schema = z.object({
  title: z.string().trim().min(6, 'Give the goal a clear, specific name.'),
  purpose: z.string().trim().min(20, 'Explain why this matters in a sentence or two.'),
  beneficiary: z.string().trim().min(3, 'Who feels the difference if this works?'),
  metricName: z.string().trim().min(3, 'Name the number you are moving.'),
  metricSource: z.string().trim().min(3, 'Say where the number comes from.'),
  target: numericField('Enter the target number.'),
  deadline: z.string().min(1, 'Pick a deadline.'),
  ownerId: z.string().min(1),
  sponsorId: z.string().optional(),
  status: z.enum(['active', 'paused', 'achieved', 'missed', 'archived']),
  tags: z.string().optional(),
})

type FormValues = z.input<typeof schema>

export function GoalDialog({
  goal,
  people,
  open,
  onClose,
}: {
  goal: Goal
  people: Person[]
  open: boolean
  onClose: () => void
}) {
  const { updateGoal } = useWorkspace()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      title: goal.title,
      purpose: goal.purpose,
      beneficiary: goal.beneficiary,
      metricName: goal.metric.name,
      metricSource: goal.metric.source,
      target: goal.metric.target,
      deadline: goal.deadline,
      ownerId: goal.ownerId,
      sponsorId: goal.sponsorId ?? '',
      status: goal.status,
      tags: goal.tags.join(', '),
    })
  }, [open, goal, reset])

  const onSubmit = handleSubmit(async (values) => {
    await updateGoal(goal.id, {
      title: values.title.trim(),
      purpose: values.purpose.trim(),
      beneficiary: values.beneficiary.trim(),
      metric: {
        ...goal.metric,
        name: values.metricName.trim(),
        source: values.metricSource.trim(),
        target: Number(values.target),
      },
      deadline: values.deadline,
      ownerId: values.ownerId,
      sponsorId: values.sponsorId || undefined,
      status: values.status,
      tags: (values.tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Edit goal"
      description="Changing the target or deadline changes what success means, so everyone on the goal will see it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="goal-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Goal" htmlFor="goal-title" required error={errors.title?.message}>
          <Input id="goal-title" invalid={Boolean(errors.title)} {...register('title')} />
        </Field>

        <Field label="Why it matters" htmlFor="goal-purpose" required error={errors.purpose?.message}>
          <Textarea id="goal-purpose" rows={4} invalid={Boolean(errors.purpose)} {...register('purpose')} />
        </Field>

        <Field
          label="Who feels the difference"
          htmlFor="goal-beneficiary"
          required
          error={errors.beneficiary?.message}
        >
          <Input
            id="goal-beneficiary"
            invalid={Boolean(errors.beneficiary)}
            {...register('beneficiary')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Metric name" htmlFor="goal-metric" required error={errors.metricName?.message}>
            <Input id="goal-metric" invalid={Boolean(errors.metricName)} {...register('metricName')} />
          </Field>
          <Field label="Target value" htmlFor="goal-target" required error={errors.target?.message}>
            <Input
              id="goal-target"
              type="number"
              step="any"
              invalid={Boolean(errors.target)}
              {...register('target')}
            />
          </Field>
          <Field
            label="Where the number comes from"
            htmlFor="goal-source"
            required
            error={errors.metricSource?.message}
            className="sm:col-span-2"
          >
            <Input
              id="goal-source"
              invalid={Boolean(errors.metricSource)}
              {...register('metricSource')}
            />
          </Field>
          <Field label="Deadline" htmlFor="goal-deadline" required error={errors.deadline?.message}>
            <Input
              id="goal-deadline"
              type="date"
              invalid={Boolean(errors.deadline)}
              {...register('deadline')}
            />
          </Field>
          <Field label="Status" htmlFor="goal-status">
            <Select id="goal-status" {...register('status')}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="achieved">Achieved</option>
              <option value="missed">Missed</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Field label="Owner" htmlFor="goal-owner" required>
            <Select id="goal-owner" {...register('ownerId')}>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sponsor" htmlFor="goal-sponsor">
            <Select id="goal-sponsor" {...register('sponsorId')}>
              <option value="">No sponsor</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Tags" htmlFor="goal-tags" hint="Separate with commas.">
          <Input id="goal-tags" placeholder="Midwest, Customer promise" {...register('tags')} />
        </Field>
      </form>
    </Dialog>
  )
}
