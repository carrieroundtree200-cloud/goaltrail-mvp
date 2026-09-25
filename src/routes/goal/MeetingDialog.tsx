import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { toDateOnly, today } from '@/lib/dates'
import { useWorkspace } from '@/state/workspace'
import type { Meeting, Person } from '@/types'

const schema = z.object({
  title: z.string().trim().min(4, 'Give the meeting a name people will recognise.'),
  date: z.string().min(1, 'Pick the date.'),
  startTime: z.string().min(1, 'Pick a start time.'),
  durationMinutes: z.coerce.number().int().min(5, 'At least 5 minutes.').max(480),
  location: z.string().trim().min(2, 'Where did it happen?'),
  attendeeIds: z.array(z.string()).min(1, 'Pick at least one attendee.'),
  agenda: z.string().optional(),
  minutes: z.string().trim().min(20, 'Write a few lines so someone who missed it can catch up.'),
  whatChanged: z
    .string()
    .trim()
    .min(15, 'This is the most useful field. What is different now that the meeting happened?'),
})

type FormValues = z.input<typeof schema>

export function MeetingDialog({
  open,
  onClose,
  goalId,
  meeting,
  people,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  goalId: string
  meeting?: Meeting
  people: Person[]
  onSaved?: (id: string) => void
}) {
  const { createMeeting, updateMeeting } = useWorkspace()
  const editing = Boolean(meeting)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      title: meeting?.title ?? '',
      date: meeting?.date ?? toDateOnly(today()),
      startTime: meeting?.startTime ?? '09:00',
      durationMinutes: meeting?.durationMinutes ?? 30,
      location: meeting?.location ?? 'Video call',
      attendeeIds: meeting?.attendeeIds ?? [],
      agenda: meeting?.agenda.join('\n') ?? '',
      minutes: meeting?.minutes ?? '',
      whatChanged: meeting?.whatChanged ?? '',
    })
  }, [open, meeting, reset])

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      goalId,
      title: values.title.trim(),
      date: values.date,
      startTime: values.startTime,
      durationMinutes: Number(values.durationMinutes),
      location: values.location.trim(),
      attendeeIds: values.attendeeIds,
      agenda: (values.agenda ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      minutes: values.minutes.trim(),
      whatChanged: values.whatChanged.trim(),
    }

    const saved = meeting
      ? await updateMeeting(meeting.id, payload)
      : await createMeeting(payload)
    onSaved?.(saved.id)
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit meeting' : 'Log a meeting'}
      description="Meetings are not scored here. What matters is what changed because you met."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="meeting-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Save meeting'}
          </Button>
        </>
      }
    >
      <form id="meeting-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Meeting" htmlFor="meeting-title" required error={errors.title?.message}>
          <Input
            id="meeting-title"
            placeholder="Weekly delivery performance check-in"
            invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Date" htmlFor="meeting-date" required error={errors.date?.message}>
            <Input id="meeting-date" type="date" invalid={Boolean(errors.date)} {...register('date')} />
          </Field>
          <Field label="Start" htmlFor="meeting-start" required error={errors.startTime?.message}>
            <Input id="meeting-start" type="time" {...register('startTime')} />
          </Field>
          <Field
            label="Minutes long"
            htmlFor="meeting-duration"
            required
            error={errors.durationMinutes?.message}
          >
            <Input
              id="meeting-duration"
              type="number"
              min={5}
              step={5}
              invalid={Boolean(errors.durationMinutes)}
              {...register('durationMinutes')}
            />
          </Field>
          <Field label="Where" htmlFor="meeting-location" required error={errors.location?.message}>
            <Input id="meeting-location" invalid={Boolean(errors.location)} {...register('location')} />
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Who was there</legend>
          {errors.attendeeIds ? (
            <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
              {errors.attendeeIds.message}
            </p>
          ) : null}
          <div className="mt-2 grid max-h-44 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {people.map((person) => (
              <label
                key={person.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  value={person.id}
                  className="accent-accent-600 size-4 rounded border-slate-300"
                  {...register('attendeeIds')}
                />
                {person.name}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Agenda" htmlFor="meeting-agenda" hint="One item per line. Optional.">
          <Textarea id="meeting-agenda" rows={3} {...register('agenda')} />
        </Field>

        <Field
          label="Minutes"
          htmlFor="meeting-minutes"
          required
          hint="Short paragraphs. Enough for someone who missed it to follow along."
          error={errors.minutes?.message}
        >
          <Textarea
            id="meeting-minutes"
            rows={6}
            invalid={Boolean(errors.minutes)}
            {...register('minutes')}
          />
        </Field>

        <Field
          label="What changed?"
          htmlFor="meeting-changed"
          required
          hint="The one paragraph people will actually read. What is different now?"
          error={errors.whatChanged?.message}
        >
          <Textarea
            id="meeting-changed"
            rows={3}
            invalid={Boolean(errors.whatChanged)}
            {...register('whatChanged')}
          />
        </Field>

        <p className="bg-canvas rounded-lg px-3 py-2.5 text-xs text-slate-600">
          Decisions, action items and risks are added on the meeting page once it is saved, so each
          one can be given an owner and a date.
        </p>
      </form>
    </Dialog>
  )
}
