import { Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { ItemRow } from '@/components/domain/ItemRow'
import { StatTile } from '@/components/domain/StatTile'
import { itemKindMeta } from '@/components/domain/status'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/states'
import { cn } from '@/lib/cn'
import { isOpenItem } from '@/lib/plan'
import { ItemDialog } from '@/routes/goal/ItemDialog'
import { useGoalView } from '@/routes/goal/context'
import { useWorkspace } from '@/state/workspace'
import type { TrackedItem, TrackedItemKind } from '@/types'

type Filter = 'all' | TrackedItemKind | 'open'

const filters: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Still open' },
  { id: 'all', label: 'Everything' },
  { id: 'risk', label: 'Risks' },
  { id: 'blocker', label: 'Blockers' },
  { id: 'change', label: 'Changes' },
]

export function RisksTab() {
  const view = useGoalView()
  const { workspace } = useWorkspace()
  const [filter, setFilter] = useState<Filter>('open')
  const [dialog, setDialog] = useState<{ open: boolean; item?: TrackedItem; kind?: TrackedItemKind }>(
    { open: false },
  )

  const { allItems, items, meetings } = view

  const visible = allItems
    .filter((item) => {
      if (filter === 'all') return true
      if (filter === 'open') return isOpenItem(item)
      return item.kind === filter
    })
    .sort((a, b) => {
      const openness = Number(isOpenItem(b)) - Number(isOpenItem(a))
      if (openness !== 0) return openness
      const weight = { critical: 0, high: 1, medium: 2, low: 3 }
      return weight[a.impact] - weight[b.impact]
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Risks &amp; changes
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-600">
            One register for three things: risks that might hurt, blockers already stopping work,
            and changes to what the team agreed.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus aria-hidden="true" className="size-4" />
          Add item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={itemKindMeta.risk.icon}
          label="Open risks"
          value={items.openRisks.length}
          hint="Might happen and would hurt"
        />
        <StatTile
          icon={itemKindMeta.blocker.icon}
          label="Open blockers"
          value={items.openBlockers.length}
          hint="Already stopping work"
          tone={items.openBlockers.length > 0 ? 'attention' : 'default'}
        />
        <StatTile
          icon={itemKindMeta.change.icon}
          label="Changes awaiting a decision"
          value={items.openChanges.length}
          hint="Would change what we agreed"
        />
      </div>

      <Section
        title="Register"
        description={`${visible.length} of ${allItems.length} items shown.`}
        action={
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter the register">
            {filters.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  filter === option.id
                    ? 'bg-accent-700 text-white'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
        flush
      >
        {visible.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={filter === 'open' ? 'Nothing open' : 'Nothing to show'}
            description={
              filter === 'open'
                ? 'No risks, blockers or changes are waiting on anyone right now.'
                : 'Change the filter, or add the first item to the register.'
            }
            action={
              <Button size="sm" onClick={() => setDialog({ open: true })}>
                Add item
              </Button>
            }
          />
        ) : (
          <div>
            {visible.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                owner={workspace.people.find((person) => person.id === item.ownerId)}
                meetingTitle={
                  meetings.find((meeting) => meeting.id === item.raisedInMeetingId)?.title
                }
                onEdit={(selected) => setDialog({ open: true, item: selected })}
              />
            ))}
          </div>
        )}
      </Section>

      <ItemDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        goalId={view.goal.id}
        item={dialog.item}
        people={workspace.people}
        meetings={meetings}
        defaultKind={dialog.kind ?? 'risk'}
      />
    </div>
  )
}
