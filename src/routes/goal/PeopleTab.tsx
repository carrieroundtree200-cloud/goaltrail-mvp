import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { roleMeta, taskStatusMeta } from '@/components/domain/status'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/states'
import { pluralize } from '@/lib/format'
import { useGoalView } from '@/routes/goal/context'
import { useWorkspace } from '@/state/workspace'
import type { GoalRole } from '@/types'

const roles: GoalRole[] = ['owner', 'sponsor', 'contributor', 'reviewer']

const schema = z.object({
  personId: z.string().min(1, 'Choose someone.'),
  role: z.enum(['owner', 'sponsor', 'contributor', 'reviewer']),
  responsibility: z.string().trim().min(6, 'Say what they are accountable for.'),
})

type FormValues = z.infer<typeof schema>

export function PeopleTab() {
  const view = useGoalView()
  const { workspace, addGoalMember, removeGoalMember } = useWorkspace()
  const [adding, setAdding] = useState(false)

  const available = useMemo(() => {
    const memberIds = new Set(view.members.map((member) => member.personId))
    return workspace.people.filter((person) => !memberIds.has(person.id))
  }, [workspace.people, view.members])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (adding) {
      reset({ personId: available[0]?.id ?? '', role: 'contributor', responsibility: '' })
    }
  }, [adding, available, reset])

  const onSubmit = handleSubmit(async (values) => {
    await addGoalMember({ goalId: view.goal.id, ...values })
    setAdding(false)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">People</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-600">
            Who is involved and what each of them is accountable for. Clear ownership is what keeps
            work from quietly stalling.
          </p>
        </div>
        <Button onClick={() => setAdding(true)} disabled={available.length === 0}>
          <Plus aria-hidden="true" className="size-4" />
          Add someone
        </Button>
      </div>

      {view.members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="Nobody is on this goal yet"
            description="Add the people doing the work so every task has a name against it."
            action={<Button onClick={() => setAdding(true)}>Add someone</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {view.members.map((member) => {
            const role = roleMeta[member.role]
            const theirTasks = view.tasks.filter((task) => task.ownerId === member.personId)
            const open = theirTasks.filter((task) => task.status !== 'done')
            const blocked = theirTasks.filter((task) => task.status === 'blocked')

            return (
              <article key={member.id} className="card flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar person={member.person} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {member.person?.name ?? 'Unknown'}
                      </p>
                      <p className="truncate text-xs text-slate-500">{member.person?.jobTitle}</p>
                    </div>
                  </div>
                  <Badge tone={member.role === 'owner' ? 'accent' : 'neutral'}>{role.label}</Badge>
                </div>

                <p className="mt-3 text-sm text-slate-600">{member.responsibility}</p>

                <div className="border-hairline mt-4 flex items-center justify-between gap-2 border-t pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="neutral" icon={taskStatusMeta.in_progress.icon}>
                      {pluralize(open.length, 'open task')}
                    </Badge>
                    {blocked.length > 0 ? (
                      <Badge tone="critical" icon={taskStatusMeta.blocked.icon}>
                        {blocked.length} blocked
                      </Badge>
                    ) : null}
                  </div>
                  {member.role === 'owner' ? null : (
                    <button
                      type="button"
                      onClick={() => void removeGoalMember(member.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      <span className="sr-only">Remove {member.person?.name} from this goal</span>
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Section
        title="What each role means"
        description="Plain definitions, so nobody has to guess."
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          {roles.map((role) => (
            <div key={role} className="bg-canvas rounded-lg px-3 py-2.5">
              <dt className="text-sm font-medium text-slate-900">{roleMeta[role].label}</dt>
              <dd className="text-sm text-slate-600">{roleMeta[role].description}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add someone to this goal"
        description="Say what they are accountable for, not just that they are involved."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button form="member-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add to goal'}
            </Button>
          </>
        }
      >
        <form id="member-form" onSubmit={onSubmit} className="space-y-4">
          <Field label="Person" htmlFor="member-person" required error={errors.personId?.message}>
            <Select id="member-person" {...register('personId')}>
              {available.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} — {person.jobTitle}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Role" htmlFor="member-role" required>
            <Select id="member-role" {...register('role')}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleMeta[role].label} — {roleMeta[role].description}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Accountable for"
            htmlFor="member-responsibility"
            required
            error={errors.responsibility?.message}
          >
            <Input
              id="member-responsibility"
              placeholder="Owns route sequencing and dispatch changes"
              invalid={Boolean(errors.responsibility)}
              {...register('responsibility')}
            />
          </Field>
        </form>
      </Dialog>
    </div>
  )
}
