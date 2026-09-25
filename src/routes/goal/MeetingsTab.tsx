import { CalendarDays, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MeetingCard } from '@/components/domain/MeetingCard'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/states'
import { formatDate } from '@/lib/dates'
import { MeetingDialog } from '@/routes/goal/MeetingDialog'
import { useGoalView } from '@/routes/goal/context'
import { useWorkspace } from '@/state/workspace'

export function MeetingsTab() {
  const view = useGoalView()
  const { workspace } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  // `?new=1` lets the header button on any tab open this dialog.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreating(true)
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { meetings, decisions, tasks, goal } = view

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Meetings</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-600">
            Every meeting here belongs to this goal. There is no rating and no score — a meeting is
            worth having if something changed because of it.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Log a meeting
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="No meetings logged yet"
            description="Write up your next check-in here. Minutes, decisions, action items and what changed all live in one place."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus aria-hidden="true" className="size-4" />
                Log the first meeting
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              people={workspace.people}
              decisionCount={decisions.filter((item) => item.meetingId === meeting.id).length}
              actionCount={tasks.filter((task) => task.meetingId === meeting.id).length}
            />
          ))}
        </div>
      )}

      {decisions.length > 0 ? (
        <Section
          title="Decision log"
          description="Every decision made for this goal, newest first, with what it changed."
          flush
        >
          <ul className="divide-hairline divide-y">
            {decisions.map((decision) => {
              const meeting = meetings.find((candidate) => candidate.id === decision.meetingId)
              return (
                <li key={decision.id} className="px-4 py-3 sm:px-5">
                  <p className="text-sm font-medium text-slate-900">{decision.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{decision.detail}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Consequence: </span>
                    {decision.consequence}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {workspace.people.find((person) => person.id === decision.decidedById)?.name ??
                      'Someone'}{' '}
                    · {formatDate(decision.date)}
                    {meeting ? ` · ${meeting.title}` : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        </Section>
      ) : null}

      <MeetingDialog
        open={creating}
        onClose={() => setCreating(false)}
        goalId={goal.id}
        people={workspace.people}
        onSaved={(id) => navigate(`/meetings/${id}`)}
      />
    </div>
  )
}
