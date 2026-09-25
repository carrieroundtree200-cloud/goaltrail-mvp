import type { LucideIcon } from 'lucide-react'

import { impactMeta, itemKindMeta, taskStatusMeta } from '@/components/domain/status'
import { daysUntil, describeDueDate, isOverdue } from '@/lib/dates'
import type { GoalView } from '@/state/selectors'
import type { Person } from '@/types'

export interface AttentionRow {
  key: string
  to: string
  title: string
  goalTitle: string
  ownerName: string
  /** Due-date wording, or what a blocked task is waiting on. */
  timing: string
  urgent: boolean
  badge: { label: string; icon: LucideIcon; tone: 'critical' | 'warning' | 'caution' }
}

/** Overdue work, blocked work and high-impact risks, across every goal. */
export function buildAttentionRows(views: GoalView[], people: Person[]): AttentionRow[] {
  const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? 'Unassigned'
  const rows: AttentionRow[] = []

  for (const view of views) {
    for (const task of view.tasks) {
      if (task.status === 'done') continue

      if (task.status === 'blocked') {
        rows.push({
          key: `task-${task.id}`,
          to: `/goals/${view.goal.id}/work`,
          title: task.title,
          goalTitle: view.goal.title,
          ownerName: nameOf(task.ownerId),
          timing: task.blockedReason ?? 'Blocked',
          urgent: true,
          badge: { label: 'Blocked', icon: taskStatusMeta.blocked.icon, tone: 'critical' },
        })
      } else if (isOverdue(task.dueDate)) {
        rows.push({
          key: `task-${task.id}`,
          to: `/goals/${view.goal.id}/work`,
          title: task.title,
          goalTitle: view.goal.title,
          ownerName: nameOf(task.ownerId),
          timing: describeDueDate(task.dueDate),
          urgent: daysUntil(task.dueDate!) < -7,
          badge: { label: 'Overdue', icon: taskStatusMeta.todo.icon, tone: 'warning' },
        })
      }
    }

    for (const item of view.items.highImpactOpen) {
      rows.push({
        key: `item-${item.id}`,
        to: `/goals/${view.goal.id}/risks`,
        title: item.title,
        goalTitle: view.goal.title,
        ownerName: nameOf(item.ownerId),
        timing: item.dueDate ? describeDueDate(item.dueDate) : 'No review date set',
        urgent: item.impact === 'critical',
        badge: {
          label: `${impactMeta[item.impact].label.replace(' impact', '')} ${itemKindMeta[item.kind].label.toLowerCase()}`,
          icon: itemKindMeta[item.kind].icon,
          tone: item.impact === 'critical' ? 'critical' : 'caution',
        },
      })
    }
  }

  return rows.sort((a, b) => Number(b.urgent) - Number(a.urgent))
}
