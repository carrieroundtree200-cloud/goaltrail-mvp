import { CalendarClock, Pencil, UserRound } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { impactMeta, itemKindMeta, itemStatusMeta } from '@/components/domain/status'
import { describeSchedule, formatDate, isOverdue } from '@/lib/dates'
import type { Person, TrackedItem } from '@/types'

interface ItemRowProps {
  item: TrackedItem
  owner?: Person
  meetingTitle?: string
  onEdit: (item: TrackedItem) => void
}

export function ItemRow({ item, owner, meetingTitle, onEdit }: ItemRowProps) {
  const kind = itemKindMeta[item.kind]
  const impact = impactMeta[item.impact]
  const status = itemStatusMeta[item.status]
  const overdue = isOverdue(item.dueDate) && !item.resolvedAt

  return (
    <article className="border-hairline border-b px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={kind.tone} icon={kind.icon}>
              {kind.label}
            </Badge>
            <Badge tone={impact.tone} icon={impact.icon}>
              {impact.label}
            </Badge>
            <Badge tone={status.tone} icon={status.icon}>
              {status.label}
            </Badge>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.detail}</p>

          {item.response ? (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800">What we are doing: </span>
              {item.response}
            </p>
          ) : null}
          {item.previously ? (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Before this change: </span>
              {item.previously}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onEdit(item)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Edit
        </button>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <UserRound aria-hidden="true" className="size-3.5" />
          <dt className="sr-only">Owner</dt>
          <dd>{owner?.name ?? 'Unassigned'}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarClock aria-hidden="true" className="size-3.5" />
          <dt className="sr-only">Review date</dt>
          <dd className={overdue ? 'font-medium text-rose-700' : undefined}>
            {item.dueDate
              ? describeSchedule(item.dueDate, Boolean(item.resolvedAt))
              : 'No review date'}
          </dd>
        </div>
        {meetingTitle ? (
          <div>
            <dt className="sr-only">Raised in</dt>
            <dd>Raised in {meetingTitle}</dd>
          </div>
        ) : null}
        {item.resolvedAt ? (
          <div>
            <dt className="sr-only">Closed</dt>
            <dd>Closed {formatDate(item.resolvedAt)}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  )
}
