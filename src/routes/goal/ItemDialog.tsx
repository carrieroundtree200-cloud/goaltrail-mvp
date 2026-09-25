import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  impactMeta,
  itemKindMeta,
  itemStatusMeta,
  itemStatusesByKind,
} from '@/components/domain/status'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useWorkspace } from '@/state/workspace'
import type { ItemImpact, Meeting, Person, TrackedItem, TrackedItemKind } from '@/types'

const kinds: TrackedItemKind[] = ['risk', 'blocker', 'change']
const impacts: ItemImpact[] = ['low', 'medium', 'high', 'critical']

const schema = z.object({
  kind: z.enum(['risk', 'blocker', 'change']),
  title: z.string().trim().min(6, 'Describe it in a short sentence.'),
  detail: z.string().trim().min(15, 'Add enough detail for someone new to understand it.'),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum([
    'open',
    'monitoring',
    'mitigating',
    'resolved',
    'accepted',
    'approved',
    'declined',
  ]),
  ownerId: z.string().min(1, 'Someone has to own it.'),
  dueDate: z.string().optional(),
  response: z.string().optional(),
  previously: z.string().optional(),
  raisedInMeetingId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function ItemDialog({
  open,
  onClose,
  goalId,
  item,
  people,
  meetings,
  defaultKind = 'risk',
}: {
  open: boolean
  onClose: () => void
  goalId: string
  item?: TrackedItem
  people: Person[]
  meetings: Meeting[]
  defaultKind?: TrackedItemKind
}) {
  const { createTrackedItem, updateTrackedItem } = useWorkspace()
  const editing = Boolean(item)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      kind: item?.kind ?? defaultKind,
      title: item?.title ?? '',
      detail: item?.detail ?? '',
      impact: item?.impact ?? 'medium',
      status: item?.status ?? 'open',
      ownerId: item?.ownerId ?? people[0]?.id ?? '',
      dueDate: item?.dueDate ?? '',
      response: item?.response ?? '',
      previously: item?.previously ?? '',
      raisedInMeetingId: item?.raisedInMeetingId ?? '',
    })
  }, [open, item, defaultKind, people, reset])

  const kind = watch('kind') ?? defaultKind

  // Each kind has its own set of statuses, so switching kind can strand the
  // selected status on an option that no longer exists.
  useEffect(() => {
    if (!open) return
    const allowed = itemStatusesByKind[kind]
    if (!allowed.includes(getValues('status'))) {
      setValue('status', allowed[0]!, { shouldValidate: true })
    }
  }, [kind, open, getValues, setValue])

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      goalId,
      kind: values.kind,
      title: values.title.trim(),
      detail: values.detail.trim(),
      impact: values.impact,
      status: values.status,
      ownerId: values.ownerId,
      dueDate: values.dueDate || undefined,
      response: values.response?.trim() || undefined,
      previously: values.previously?.trim() || undefined,
      raisedInMeetingId: values.raisedInMeetingId || undefined,
    }

    if (item) {
      await updateTrackedItem(item.id, payload)
    } else {
      await createTrackedItem(payload)
    }
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? `Edit ${itemKindMeta[kind].label.toLowerCase()}` : 'Add to the register'}
      description="Risks, blockers and changes all live in one register so nothing falls between them."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="item-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Add item'}
          </Button>
        </>
      }
    >
      <form id="item-form" onSubmit={onSubmit} className="space-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">What kind of item is this?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {kinds.map((option) => {
              const meta = itemKindMeta[option]
              return (
                <label
                  key={option}
                  className="has-checked:border-accent-500 has-checked:bg-accent-50 flex cursor-pointer items-start gap-2 rounded-lg border border-slate-300 px-3 py-2.5 hover:bg-slate-50"
                >
                  <input type="radio" value={option} className="sr-only" {...register('kind')} />
                  <meta.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-500" />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{meta.label}</span>
                    <span className="block text-xs text-slate-500">
                      {option === 'risk'
                        ? 'Might happen and would hurt'
                        : option === 'blocker'
                          ? 'Already stopping work'
                          : 'Changes what we agreed'}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <Field label="Title" htmlFor="item-title" required error={errors.title?.message}>
          <Input id="item-title" invalid={Boolean(errors.title)} {...register('title')} />
        </Field>

        <Field label="Detail" htmlFor="item-detail" required error={errors.detail?.message}>
          <Textarea id="item-detail" rows={3} invalid={Boolean(errors.detail)} {...register('detail')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Impact" htmlFor="item-impact" required>
            <Select id="item-impact" {...register('impact')}>
              {impacts.map((impact) => (
                <option key={impact} value={impact}>
                  {impactMeta[impact].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="item-status" required>
            <Select id="item-status" {...register('status')}>
              {itemStatusesByKind[kind].map((status) => (
                <option key={status} value={status}>
                  {itemStatusMeta[status].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Owner" htmlFor="item-owner" required error={errors.ownerId?.message}>
            <Select id="item-owner" {...register('ownerId')}>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Review by"
            htmlFor="item-due"
            hint="When someone should look at this again."
          >
            <Input id="item-due" type="date" {...register('dueDate')} />
          </Field>
        </div>

        {kind === 'change' ? (
          <Field
            label="What was true before this change"
            htmlFor="item-previously"
            hint="So the history of the goal stays readable."
          >
            <Textarea id="item-previously" rows={2} {...register('previously')} />
          </Field>
        ) : (
          <Field
            label="What we are doing about it"
            htmlFor="item-response"
            hint="The plan to reduce or remove it."
          >
            <Textarea id="item-response" rows={2} {...register('response')} />
          </Field>
        )}

        <Field label="Raised in" htmlFor="item-meeting" hint="Optional.">
          <Select id="item-meeting" {...register('raisedInMeetingId')}>
            <option value="">Not raised in a meeting</option>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.title} — {meeting.date}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Dialog>
  )
}
