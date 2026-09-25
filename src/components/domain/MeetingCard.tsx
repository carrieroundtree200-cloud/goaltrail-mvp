import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AvatarGroup } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/dates'
import { pluralize } from '@/lib/format'
import type { Meeting, Person } from '@/types'

interface MeetingCardProps {
  meeting: Meeting
  people: Person[]
  decisionCount: number
  actionCount: number
}

export function MeetingCard({ meeting, people, decisionCount, actionCount }: MeetingCardProps) {
  const attendees = meeting.attendeeIds.map((id) => people.find((person) => person.id === id))

  return (
    <article className="card hover:border-accent-300 relative p-4 transition-colors sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            <Link
              to={`/meetings/${meeting.id}`}
              className="before:absolute before:inset-0 before:content-['']"
            >
              {meeting.title}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatDate(meeting.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock aria-hidden="true" className="size-3.5" />
              {meeting.startTime} · {meeting.durationMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-3.5" />
              {meeting.location}
            </span>
          </div>
        </div>
        <AvatarGroup people={attendees} />
      </div>

      <p className="mt-3 text-sm text-slate-600">
        <span className="font-medium text-slate-800">What changed: </span>
        {meeting.whatChanged}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {pluralize(decisionCount, 'decision')} · {pluralize(actionCount, 'action item')} ·{' '}
        {pluralize(meeting.attendeeIds.length, 'attendee')}
      </p>
    </article>
  )
}
