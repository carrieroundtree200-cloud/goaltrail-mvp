import { History } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/states'
import { formatRelative } from '@/lib/dates'
import type { ActivityEvent, Goal, Person } from '@/types'

interface ActivityFeedProps {
  events: ActivityEvent[]
  people: Person[]
  /** Pass goals to show which goal each event belongs to. */
  goals?: Goal[]
  limit?: number
}

export function ActivityFeed({ events, people, goals, limit = 12 }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Changes to goals, work and meetings will show up here as the team makes them."
      />
    )
  }

  return (
    <ol className="divide-hairline divide-y">
      {events.slice(0, limit).map((event) => {
        const actor = people.find((person) => person.id === event.actorId)
        const goal = goals?.find((candidate) => candidate.id === event.goalId)
        return (
          <li key={event.id} className="flex gap-3 px-4 py-3 sm:px-5">
            <Avatar person={actor} size="xs" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">{actor?.name ?? 'Someone'}</span>{' '}
                {event.summary}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatRelative(event.at)}
                {goal ? (
                  <>
                    {' · '}
                    <Link to={`/goals/${goal.id}`} className="hover:text-accent-700 underline-offset-2 hover:underline">
                      {goal.title}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
