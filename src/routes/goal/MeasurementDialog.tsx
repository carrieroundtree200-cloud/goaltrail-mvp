import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { toDateOnly, today } from '@/lib/dates'
import { formatMetricValue } from '@/lib/format'
import { numericField } from '@/lib/validation'
import { useWorkspace } from '@/state/workspace'
import type { Goal } from '@/types'

const schema = z.object({
  date: z.string().min(1, 'Pick the date this measurement is for.'),
  value: numericField('Enter the number you measured.'),
  note: z.string().max(280, 'Keep the note under 280 characters.').optional(),
})

type FormValues = z.input<typeof schema>

export function MeasurementDialog({
  goal,
  open,
  onClose,
}: {
  goal: Goal
  open: boolean
  onClose: () => void
}) {
  const { recordMetricReading } = useWorkspace()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: toDateOnly(today()), value: '', note: '' },
  })

  useEffect(() => {
    if (open) reset({ date: toDateOnly(today()), value: '', note: '' })
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    await recordMetricReading({
      goalId: goal.id,
      date: values.date,
      value: Number(values.value),
      note: values.note?.trim() ? values.note.trim() : undefined,
    })
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record a measurement"
      description={`${goal.metric.name} — ${goal.metric.source}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="measurement-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save measurement'}
          </Button>
        </>
      }
    >
      <form id="measurement-form" onSubmit={onSubmit} className="space-y-4">
        <div className="bg-canvas rounded-lg px-3 py-2.5 text-sm text-slate-600">
          Baseline was {formatMetricValue(goal.metric.baseline, goal.metric.unit)} and the target is{' '}
          {formatMetricValue(goal.metric.target, goal.metric.unit)}. Readings are expected{' '}
          {goal.metric.cadence}.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="reading-date" required error={errors.date?.message}>
            <Input id="reading-date" type="date" invalid={Boolean(errors.date)} {...register('date')} />
          </Field>
          <Field
            label={`Value (${goal.metric.unit === 'currency' ? 'US dollars' : goal.metric.unit})`}
            htmlFor="reading-value"
            required
            error={errors.value?.message}
          >
            <Input
              id="reading-value"
              type="number"
              step="any"
              inputMode="decimal"
              invalid={Boolean(errors.value)}
              {...register('value')}
            />
          </Field>
        </div>

        <Field
          label="Note"
          htmlFor="reading-note"
          hint="Optional. Anything that explains this reading, such as a one-off event."
          error={errors.note?.message}
        >
          <Textarea id="reading-note" rows={3} {...register('note')} />
        </Field>
      </form>
    </Dialog>
  )
}
