import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Page, PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { daysUntil, formatDate, shiftDays, toDateOnly, today } from '@/lib/dates'
import { formatMetricValue } from '@/lib/format'
import { smartBreakdown, smartStatement } from '@/lib/smart'
import { useWorkspace } from '@/state/workspace'
import type { MetricUnit } from '@/types'

const units: { value: MetricUnit; label: string }[] = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'currency', label: 'Money (US dollars)' },
  { value: 'count', label: 'A count of things' },
  { value: 'days', label: 'Days' },
  { value: 'hours', label: 'Hours' },
  { value: 'rating', label: 'A score or rating' },
]

const schema = z
  .object({
    title: z.string().trim().min(6, 'Give the goal a clear, specific name.'),
    purpose: z.string().trim().min(20, 'Two sentences on why this matters is plenty.'),
    beneficiary: z.string().trim().min(3, 'Who feels the difference if this works?'),
    tags: z.string().optional(),

    metricName: z.string().trim().min(3, 'Name the number you are moving.'),
    unit: z.enum(['percent', 'currency', 'count', 'days', 'hours', 'rating']),
    direction: z.enum(['increase', 'decrease']),
    baseline: z.coerce.number({ invalid_type_error: 'Enter a number.' }),
    target: z.coerce.number({ invalid_type_error: 'Enter a number.' }),
    source: z.string().trim().min(5, 'Say where the number comes from.'),
    cadence: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),

    startDate: z.string().min(1, 'Pick a start date.'),
    deadline: z.string().min(1, 'Pick a deadline.'),
    ownerId: z.string().min(1, 'Every goal needs one accountable owner.'),
    sponsorId: z.string().optional(),
    contributorIds: z.array(z.string()).optional(),
    milestones: z
      .array(
        z.object({
          title: z.string().trim().min(3, 'Name the milestone.'),
          dueDate: z.string().min(1, 'Pick a date.'),
        }),
      )
      .optional(),
  })
  .superRefine((values, context) => {
    if (values.baseline === values.target) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target'],
        message: 'The target has to be different from the baseline.',
      })
    }
    if (values.direction === 'increase' && values.target < values.baseline) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target'],
        message: 'You chose "higher is better", so the target should be above the baseline.',
      })
    }
    if (values.direction === 'decrease' && values.target > values.baseline) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target'],
        message: 'You chose "lower is better", so the target should be below the baseline.',
      })
    }
    if (values.deadline <= values.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deadline'],
        message: 'The deadline has to be after the start date.',
      })
    }
  })

type FormValues = z.input<typeof schema>
type Output = z.output<typeof schema>

const steps = [
  { title: 'The goal', blurb: 'What you are trying to achieve, and why it matters.' },
  { title: 'The measure', blurb: 'The real-world number that decides whether it worked.' },
  { title: 'Dates and people', blurb: 'When it has to be done and who is accountable.' },
  { title: 'Review', blurb: 'Read it back before anyone commits to it.' },
]

const stepFields: FieldPath<FormValues>[][] = [
  ['title', 'purpose', 'beneficiary'],
  ['metricName', 'unit', 'direction', 'baseline', 'target', 'source', 'cadence'],
  ['startDate', 'deadline', 'ownerId', 'milestones'],
  [],
]

export function NewGoal() {
  const { workspace, createGoal } = useWorkspace()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      purpose: '',
      beneficiary: '',
      tags: '',
      metricName: '',
      unit: 'percent',
      direction: 'increase',
      baseline: '' as unknown as number,
      target: '' as unknown as number,
      source: '',
      cadence: 'weekly',
      startDate: toDateOnly(today()),
      deadline: shiftDays(90),
      ownerId: workspace.people[0]?.id ?? '',
      sponsorId: '',
      contributorIds: [],
      milestones: [],
    },
  })

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const milestoneFields = useFieldArray({ control, name: 'milestones' })
  const values = watch()

  const preview = {
    title: values.title || 'Your goal',
    purpose: values.purpose || '',
    beneficiary: values.beneficiary || '',
    startDate: values.startDate || toDateOnly(today()),
    deadline: values.deadline || shiftDays(90),
    metric: {
      name: values.metricName || 'Your metric',
      unit: (values.unit ?? 'percent') as MetricUnit,
      baseline: Number(values.baseline) || 0,
      target: Number(values.target) || 0,
      direction: values.direction ?? 'increase',
      source: values.source || '',
      cadence: values.cadence ?? 'weekly',
    },
  }

  const ownerName = workspace.people.find((person) => person.id === values.ownerId)?.name

  async function goNext() {
    const fields = stepFields[step] ?? []
    const valid = fields.length === 0 ? true : await trigger(fields, { shouldFocus: true })
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const onSubmit = handleSubmit(async (raw) => {
    const parsed = raw as unknown as Output
    const goal = await createGoal({
      title: parsed.title.trim(),
      purpose: parsed.purpose.trim(),
      beneficiary: parsed.beneficiary.trim(),
      metric: {
        name: parsed.metricName.trim(),
        unit: parsed.unit,
        baseline: parsed.baseline,
        target: parsed.target,
        direction: parsed.direction,
        source: parsed.source.trim(),
        cadence: parsed.cadence,
      },
      startDate: parsed.startDate,
      deadline: parsed.deadline,
      ownerId: parsed.ownerId,
      sponsorId: parsed.sponsorId || undefined,
      tags: (parsed.tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      initialReading: {
        date: parsed.startDate,
        value: parsed.baseline,
        note: 'Baseline recorded when the goal was created',
      },
      milestones: (parsed.milestones ?? []).map((milestone) => ({
        title: milestone.title.trim(),
        detail: 'Added while creating the goal. Add the detail when the plan firms up.',
        dueDate: milestone.dueDate,
        ownerId: parsed.ownerId,
      })),
      members: (parsed.contributorIds ?? []).map((personId) => ({
        personId,
        role: 'contributor' as const,
        responsibility: 'Contributes to the plan',
      })),
    })

    navigate(`/goals/${goal.id}`)
  })

  return (
    <Page className="max-w-4xl space-y-6">
      <PageHeader
        title="Create a goal"
        description="A goal in GoalTrail is a real-world number you are trying to move by a date. Start with the number, and the plan follows."
        actions={
          <ButtonLink to="/dashboard" variant="ghost">
            Cancel
          </ButtonLink>
        }
      />

      <ol className="grid gap-2 sm:grid-cols-4" aria-label="Steps">
        {steps.map((item, index) => {
          const state = index === step ? 'current' : index < step ? 'done' : 'upcoming'
          return (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-left transition-colors',
                  state === 'current' && 'border-accent-500 bg-accent-50',
                  state === 'done' && 'border-hairline bg-white hover:bg-slate-50',
                  state === 'upcoming' && 'border-hairline bg-white opacity-60',
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold',
                      state === 'done'
                        ? 'bg-accent-700 text-white'
                        : state === 'current'
                          ? 'bg-accent-200 text-accent-900'
                          : 'bg-slate-200 text-slate-600',
                    )}
                  >
                    {state === 'done' ? <Check aria-hidden="true" className="size-3" /> : index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-900">{item.title}</span>
                </span>
                <span className="mt-1 block text-xs text-slate-500">{item.blurb}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <form onSubmit={onSubmit} className="card p-5 sm:p-6">
        {step === 0 ? (
          <div className="space-y-4">
            <Field
              label="What is the goal?"
              htmlFor="w-title"
              required
              hint="Write it the way you would say it out loud."
              error={errors.title?.message}
            >
              <Input
                id="w-title"
                placeholder="Cut late deliveries across the Midwest region"
                invalid={Boolean(errors.title)}
                {...register('title')}
              />
            </Field>

            <Field
              label="Why does it matter?"
              htmlFor="w-purpose"
              required
              hint="What goes wrong today, and what is at stake if nothing changes."
              error={errors.purpose?.message}
            >
              <Textarea
                id="w-purpose"
                rows={5}
                invalid={Boolean(errors.purpose)}
                {...register('purpose')}
              />
            </Field>

            <Field
              label="Who feels the difference?"
              htmlFor="w-beneficiary"
              required
              error={errors.beneficiary?.message}
            >
              <Input
                id="w-beneficiary"
                placeholder="Midwest customers and the accounts up for renewal"
                invalid={Boolean(errors.beneficiary)}
                {...register('beneficiary')}
              />
            </Field>

            <Field label="Tags" htmlFor="w-tags" hint="Optional. Separate with commas.">
              <Input id="w-tags" placeholder="Midwest, Customer promise" {...register('tags')} />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="bg-canvas rounded-lg px-3.5 py-3 text-sm text-slate-600">
              This is the number that decides whether the goal succeeded. Finishing every task will
              not count as success if this number has not moved.
            </div>

            <Field
              label="What number are you moving?"
              htmlFor="w-metric"
              required
              error={errors.metricName?.message}
            >
              <Input
                id="w-metric"
                placeholder="On-time delivery rate"
                invalid={Boolean(errors.metricName)}
                {...register('metricName')}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Measured in" htmlFor="w-unit" required>
                <Select id="w-unit" {...register('unit')}>
                  {units.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Which way is good?" htmlFor="w-direction" required>
                <Select id="w-direction" {...register('direction')}>
                  <option value="increase">Higher is better</option>
                  <option value="decrease">Lower is better</option>
                </Select>
              </Field>
              <Field
                label="Where it stands today (baseline)"
                htmlFor="w-baseline"
                required
                error={errors.baseline?.message}
              >
                <Input
                  id="w-baseline"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  invalid={Boolean(errors.baseline)}
                  {...register('baseline')}
                />
              </Field>
              <Field
                label="Where it needs to be (target)"
                htmlFor="w-target"
                required
                error={errors.target?.message}
              >
                <Input
                  id="w-target"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  invalid={Boolean(errors.target)}
                  {...register('target')}
                />
              </Field>
            </div>

            <Field
              label="Where does the number come from?"
              htmlFor="w-source"
              required
              hint="Name the report, export or dashboard, so nobody argues about the figure later."
              error={errors.source?.message}
            >
              <Input
                id="w-source"
                placeholder="Weekly dispatch export from RouteOne"
                invalid={Boolean(errors.source)}
                {...register('source')}
              />
            </Field>

            <Field label="How often will you read it?" htmlFor="w-cadence" required>
              <Select id="w-cadence" {...register('cadence')}>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="biweekly">Every two weeks</option>
                <option value="monthly">Every month</option>
              </Select>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date" htmlFor="w-start" required error={errors.startDate?.message}>
                <Input
                  id="w-start"
                  type="date"
                  invalid={Boolean(errors.startDate)}
                  {...register('startDate')}
                />
              </Field>
              <Field label="Deadline" htmlFor="w-deadline" required error={errors.deadline?.message}>
                <Input
                  id="w-deadline"
                  type="date"
                  invalid={Boolean(errors.deadline)}
                  {...register('deadline')}
                />
              </Field>
              <Field
                label="Owner"
                htmlFor="w-owner"
                required
                hint="One person, accountable for the target being met."
                error={errors.ownerId?.message}
              >
                <Select id="w-owner" {...register('ownerId')}>
                  {workspace.people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} — {person.jobTitle}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sponsor" htmlFor="w-sponsor" hint="Optional. Who clears the obstacles.">
                <Select id="w-sponsor" {...register('sponsorId')}>
                  <option value="">No sponsor</option>
                  {workspace.people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Who else is involved?</legend>
              <p className="mt-0.5 text-xs text-slate-500">
                Optional. You can add people and their responsibilities later.
              </p>
              <div className="mt-2 grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {workspace.people.map((person) => (
                  <label
                    key={person.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      value={person.id}
                      className="accent-accent-600 size-4 rounded border-slate-300"
                      {...register('contributorIds')}
                    />
                    {person.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="border-hairline border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-700">First milestones</h3>
                  <p className="text-xs text-slate-500">
                    Optional. A few checkpoints now save a lot of guessing later.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    milestoneFields.append({ title: '', dueDate: shiftDays(30) })
                  }
                >
                  <Plus aria-hidden="true" className="size-3.5" />
                  Add milestone
                </Button>
              </div>

              {milestoneFields.fields.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {milestoneFields.fields.map((field, index) => (
                    <li key={field.id} className="flex flex-wrap items-start gap-2">
                      <div className="min-w-48 flex-1">
                        <label className="sr-only" htmlFor={`w-ms-title-${index}`}>
                          Milestone {index + 1} name
                        </label>
                        <Input
                          id={`w-ms-title-${index}`}
                          placeholder="Re-sequence the evening routes"
                          invalid={Boolean(errors.milestones?.[index]?.title)}
                          {...register(`milestones.${index}.title` as const)}
                        />
                        {errors.milestones?.[index]?.title ? (
                          <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                            {errors.milestones[index]?.title?.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label className="sr-only" htmlFor={`w-ms-date-${index}`}>
                          Milestone {index + 1} due date
                        </label>
                        <Input
                          id={`w-ms-date-${index}`}
                          type="date"
                          {...register(`milestones.${index}.dueDate` as const)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => milestoneFields.remove(index)}
                        className="mt-1.5 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        <span className="sr-only">Remove milestone {index + 1}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div className="border-accent-200 bg-accent-50 rounded-xl border px-4 py-3.5">
              <p className="text-accent-800 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Your goal in one sentence
              </p>
              <p className="text-accent-900 mt-1.5 text-base font-medium">
                {smartStatement(preview, ownerName)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">SMART check</h3>
              <p className="text-sm text-slate-500">
                Read each line. If one of them is vague, go back and sharpen it.
              </p>
              <ul className="mt-3 space-y-3">
                {smartBreakdown(preview, ownerName).map((part) => (
                  <li key={part.letter} className="flex gap-3">
                    <span className="bg-accent-100 text-accent-800 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                      {part.letter}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{part.label}</p>
                      <p className="text-sm text-slate-600">{part.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="border-hairline grid gap-3 border-t pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Baseline today</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {formatMetricValue(preview.metric.baseline, preview.metric.unit)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Target</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {formatMetricValue(preview.metric.target, preview.metric.unit)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Time to get there</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {Math.max(daysUntil(preview.deadline), 0)} days, ending{' '}
                  {formatDate(preview.deadline)}
                </dd>
              </div>
            </dl>

            {(values.milestones ?? []).length > 0 ? (
              <div className="border-hairline border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-900">Starting milestones</h3>
                <ul className="mt-2 space-y-1.5">
                  {(values.milestones ?? []).map((milestone, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
                      <Badge tone="neutral">{index + 1}</Badge>
                      {milestone.title || 'Unnamed milestone'} · {formatDate(milestone.dueDate)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="text-sm text-slate-500">
              The baseline is saved as the first measurement so the goal has something to move from.
            </p>
          </div>
        ) : null}

        <div className="border-hairline mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0 || isSubmitting}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back
          </Button>

          <p className="text-xs text-slate-500">
            Step {step + 1} of {steps.length}
          </p>

          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => void goNext()}>
              Continue
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create goal'}
              <Check aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      </form>
    </Page>
  )
}
