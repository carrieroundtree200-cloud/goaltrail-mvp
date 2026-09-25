import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Clock,
  Gavel,
  MapPin,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'

import { HealthBadge } from '@/components/domain/HealthBadge'
import { ItemRow } from '@/components/domain/ItemRow'
import { priorityMeta, taskStatusMeta } from '@/components/domain/status'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/states'
import { describeSchedule, formatDate, toDateOnly, today } from '@/lib/dates'
import { formatMetricValue } from '@/lib/format'
import { ItemDialog } from '@/routes/goal/ItemDialog'
import { MeetingDialog } from '@/routes/goal/MeetingDialog'
import { TaskDialog } from '@/routes/goal/TaskDialog'
import { selectGoalView, selectMeeting } from '@/state/selectors'
import { useWorkspace } from '@/state/workspace'
import type { Task, TrackedItem } from '@/types'

const decisionSchema = z.object({
  title: z.string().trim().min(6, 'What was decided?'),
  detail: z.string().trim().min(10, 'A sentence of context helps later.'),
  consequence: z.string().trim().min(10, 'What does this change from here?'),
  decidedById: z.string().min(1),
  date: z.string().min(1),
})

type DecisionValues = z.infer<typeof decisionSchema>

export function MeetingDetail() {
  const { meetingId = '' } = useParams()
  const { status, error, workspace, reload, createDecision, deleteDecision } = useWorkspace()

  const [editing, setEditing] = useState(false)
  const [addingDecision, setAddingDecision] = useState(false)
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: Task }>({ open: false })
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item?: TrackedItem }>({
    open: false,
  })

  const detail = status === 'ready' ? selectMeeting(workspace, meetingId) : undefined

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DecisionValues>({ resolver: zodResolver(decisionSchema) })

  // Kept as plain strings rather than depending on `detail`, which is rebuilt on
  // every render: an unstable dependency here would wipe the form mid-typing.
  const defaultDecidedBy = detail?.attendees[0]?.id ?? workspace.people[0]?.id ?? ''
  const defaultDecisionDate = detail?.meeting.date ?? toDateOnly(today())

  useEffect(() => {
    if (!addingDecision) return
    reset({
      title: '',
      detail: '',
      consequence: '',
      decidedById: defaultDecidedBy,
      date: defaultDecisionDate,
    })
  }, [addingDecision, defaultDecidedBy, defaultDecisionDate, reset])

  if (status === 'loading') {
    return (
      <Page>
        <LoadingPanel label="Loading the meeting" />
      </Page>
    )
  }

  if (status === 'error') {
    return (
      <Page>
        <ErrorState message={error ?? 'Unknown error'} onRetry={() => void reload()} />
      </Page>
    )
  }

  if (!detail || !detail.goal) {
    return (
      <Page>
        <ErrorState
          title="Meeting not found"
          message="This meeting may have been removed, or the link is out of date."
        />
        <div className="mt-4 flex justify-center">
          <ButtonLink to="/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
        </div>
      </Page>
    )
  }

  const { meeting, goal, attendees, decisions, items, actionItems } = detail
  const goalView = selectGoalView(workspace, goal.id)

  const onSubmitDecision = handleSubmit(async (values) => {
    await createDecision({ goalId: goal.id, meetingId: meeting.id, ...values })
    setAddingDecision(false)
  })

  return (
    <Page className="space-y-6">
      <Link
        to={`/goals/${goal.id}/meetings`}
        className="hover:text-accent-700 inline-flex items-center gap-1.5 text-sm text-slate-500"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to {goal.title}
      </Link>

      <PageHeader
        eyebrow={
          <>
            {goalView ? <HealthBadge level={goalView.health.level} /> : null}
            <Badge tone="neutral" icon={CalendarDays}>
              {formatDate(meeting.date)}
            </Badge>
            <Badge tone="neutral" icon={Clock}>
              {meeting.startTime} · {meeting.durationMinutes} min
            </Badge>
            <Badge tone="neutral" icon={MapPin}>
              {meeting.location}
            </Badge>
          </>
        }
        title={meeting.title}
        description={
          <>
            Part of{' '}
            <Link
              to={`/goals/${goal.id}`}
              className="text-accent-700 font-medium underline-offset-2 hover:underline"
            >
              {goal.title}
            </Link>
          </>
        }
        actions={
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit meeting
          </Button>
        }
      />

      <div className="border-accent-200 bg-accent-50 rounded-xl border px-4 py-3.5">
        <p className="text-accent-800 text-xs font-semibold tracking-wide uppercase">
          What changed?
        </p>
        <p className="text-accent-900 mt-1.5 text-sm leading-relaxed">{meeting.whatChanged}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Section title="Minutes" description="What was discussed, in short paragraphs.">
            <div className="space-y-3 text-sm leading-relaxed whitespace-pre-line text-slate-700">
              {meeting.minutes}
            </div>
          </Section>

          <Section
            title="Decisions"
            description="Choices made in this meeting, and what each one changes."
            action={
              <Button variant="secondary" size="sm" onClick={() => setAddingDecision(true)}>
                <Plus aria-hidden="true" className="size-3.5" />
                Add decision
              </Button>
            }
            flush
          >
            {decisions.length === 0 ? (
              <EmptyState
                icon={Gavel}
                title="No decisions recorded"
                description="If the meeting settled something, record it here so nobody relitigates it later."
                action={
                  <Button size="sm" onClick={() => setAddingDecision(true)}>
                    Add a decision
                  </Button>
                }
              />
            ) : (
              <ul className="divide-hairline divide-y">
                {decisions.map((decision) => (
                  <li key={decision.id} className="flex gap-3 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{decision.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{decision.detail}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Consequence: </span>
                        {decision.consequence}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Decided by{' '}
                        {workspace.people.find((person) => person.id === decision.decidedById)
                          ?.name ?? 'someone'}{' '}
                        on {formatDate(decision.date)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteDecision(decision.id)}
                      className="h-fit rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      <span className="sr-only">Remove the decision {decision.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Action items"
            description="Work agreed in this meeting. Each one lands on the goal's work board."
            action={
              <Button variant="secondary" size="sm" onClick={() => setTaskDialog({ open: true })}>
                <Plus aria-hidden="true" className="size-3.5" />
                Add action item
              </Button>
            }
            flush
          >
            {actionItems.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No action items yet"
                description="Give the work a name, an owner and a date before everyone leaves the room."
                action={
                  <Button size="sm" onClick={() => setTaskDialog({ open: true })}>
                    Add an action item
                  </Button>
                }
              />
            ) : (
              <ul className="divide-hairline divide-y">
                {actionItems.map((task) => {
                  const state = taskStatusMeta[task.status]
                  const priority = priorityMeta[task.priority]
                  return (
                    <li
                      key={task.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {workspace.people.find((person) => person.id === task.ownerId)?.name ??
                            'Unassigned'}{' '}
                          · {describeSchedule(task.dueDate, task.status === 'done')}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Badge tone={priority.tone} icon={priority.icon}>
                          {priority.label}
                        </Badge>
                        <Badge tone={state.tone} icon={state.icon}>
                          {state.label}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => setTaskDialog({ open: true, task })}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil aria-hidden="true" className="size-3.5" />
                          <span className="sr-only">Edit {task.title}</span>
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>

          <Section
            title="Risks and changes raised here"
            action={
              <Button variant="secondary" size="sm" onClick={() => setItemDialog({ open: true })}>
                <Plus aria-hidden="true" className="size-3.5" />
                Raise an item
              </Button>
            }
            flush
          >
            {items.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="Nothing raised in this meeting"
                description="If a risk, blocker or change came up, record it so it carries forward."
                action={
                  <Button size="sm" onClick={() => setItemDialog({ open: true })}>
                    Raise an item
                  </Button>
                }
              />
            ) : (
              <div>
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    owner={workspace.people.find((person) => person.id === item.ownerId)}
                    onEdit={(selected) => setItemDialog({ open: true, item: selected })}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Who was there" description={`${attendees.length} people`}>
            <ul className="space-y-2.5">
              {attendees.map((person) => (
                <li key={person.id} className="flex items-center gap-2.5">
                  <Avatar person={person} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{person.name}</p>
                    <p className="truncate text-xs text-slate-500">{person.jobTitle}</p>
                  </div>
                </li>
              ))}
            </ul>
            {attendees.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Users aria-hidden="true" className="size-4" />
                Nobody recorded as attending.
              </p>
            ) : null}
          </Section>

          {meeting.agenda.length > 0 ? (
            <Section title="Agenda">
              <ol className="list-decimal space-y-1.5 pl-4 text-sm text-slate-700 marker:text-slate-400">
                {meeting.agenda.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </Section>
          ) : null}

          {goalView ? (
            <Section title="Where the goal stands now" description={goal.metric.name}>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {formatMetricValue(goalView.metric.current, goal.metric.unit)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Target {formatMetricValue(goalView.metric.target, goal.metric.unit)} by{' '}
                {formatDate(goal.deadline)}.
              </p>
              <ButtonLink to={`/goals/${goal.id}`} variant="secondary" size="sm" className="mt-3">
                Open the goal
              </ButtonLink>
            </Section>
          ) : null}
        </div>
      </div>

      <MeetingDialog
        open={editing}
        onClose={() => setEditing(false)}
        goalId={goal.id}
        meeting={meeting}
        people={workspace.people}
      />

      <TaskDialog
        open={taskDialog.open}
        onClose={() => setTaskDialog({ open: false })}
        goalId={goal.id}
        task={taskDialog.task}
        people={workspace.people}
        milestones={goalView?.milestones ?? []}
        meetingId={meeting.id}
        defaultStatus="todo"
      />

      <ItemDialog
        open={itemDialog.open}
        onClose={() => setItemDialog({ open: false })}
        goalId={goal.id}
        item={itemDialog.item}
        people={workspace.people}
        meetings={[meeting]}
      />

      <Dialog
        open={addingDecision}
        onClose={() => setAddingDecision(false)}
        title="Record a decision"
        description="Write it so somebody reading in three months knows what was settled and why."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAddingDecision(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button form="decision-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Record decision'}
            </Button>
          </>
        }
      >
        <form id="decision-form" onSubmit={onSubmitDecision} className="space-y-4">
          <Field label="Decision" htmlFor="decision-title" required error={errors.title?.message}>
            <Input
              id="decision-title"
              placeholder="Run pre-staging as a two-week trial on dock 4 only"
              invalid={Boolean(errors.title)}
              {...register('title')}
            />
          </Field>
          <Field label="Detail" htmlFor="decision-detail" required error={errors.detail?.message}>
            <Textarea
              id="decision-detail"
              rows={3}
              invalid={Boolean(errors.detail)}
              {...register('detail')}
            />
          </Field>
          <Field
            label="What this changes"
            htmlFor="decision-consequence"
            required
            error={errors.consequence?.message}
          >
            <Textarea
              id="decision-consequence"
              rows={2}
              invalid={Boolean(errors.consequence)}
              {...register('consequence')}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Decided by" htmlFor="decision-by" required>
              <Select id="decision-by" {...register('decidedById')}>
                {workspace.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" htmlFor="decision-date" required>
              <Input id="decision-date" type="date" {...register('date')} />
            </Field>
          </div>
        </form>
      </Dialog>
    </Page>
  )
}
