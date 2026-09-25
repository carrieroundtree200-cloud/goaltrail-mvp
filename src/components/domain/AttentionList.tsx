import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/states'
import type { AttentionRow } from '@/lib/attention'

export function AttentionList({ rows, limit = 6 }: { rows: AttentionRow[]; limit?: number }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nothing needs attention"
        description="No overdue work, nothing blocked, and no high-impact risks left open."
      />
    )
  }

  return (
    <ul className="divide-hairline divide-y">
      {rows.slice(0, limit).map((row) => {
        const Icon = row.badge.icon
        return (
          <li key={row.key}>
            <Link
              to={row.to}
              className="flex flex-col gap-1.5 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{row.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {row.goalTitle} · {row.ownerName}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="max-w-64 truncate text-xs text-slate-500" title={row.timing}>
                  {row.timing}
                </span>
                <Badge tone={row.badge.tone} icon={Icon}>
                  {row.badge.label}
                </Badge>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
