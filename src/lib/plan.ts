import { daysUntil, isOverdue, toDate } from '@/lib/dates'
import type { Milestone, Task, TrackedItem } from '@/types'

/**
 * Plan progress: how much of the agreed work is done. This is never presented
 * as goal success — a team can finish every task and still miss the target.
 */
export interface PlanProgress {
  totalTasks: number
  doneTasks: number
  inProgressTasks: number
  blockedTasks: number
  overdueTasks: number
  /** 0–1 share of tasks completed. */
  taskCompletion: number
  totalMilestones: number
  doneMilestones: number
  overdueMilestones: number
  nextMilestone?: Milestone
}

export function computePlanProgress(tasks: Task[], milestones: Milestone[]): PlanProgress {
  const doneTasks = tasks.filter((task) => task.status === 'done').length
  const blockedTasks = tasks.filter((task) => task.status === 'blocked').length
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length
  const overdueTasks = tasks.filter(
    (task) => task.status !== 'done' && isOverdue(task.dueDate),
  ).length

  const doneMilestones = milestones.filter((milestone) => milestone.status === 'done').length
  const overdueMilestones = milestones.filter(
    (milestone) => milestone.status !== 'done' && isOverdue(milestone.dueDate),
  ).length

  const nextMilestone = milestones
    .filter((milestone) => milestone.status !== 'done')
    .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime())[0]

  return {
    totalTasks: tasks.length,
    doneTasks,
    inProgressTasks,
    blockedTasks,
    overdueTasks,
    taskCompletion: tasks.length === 0 ? 0 : doneTasks / tasks.length,
    totalMilestones: milestones.length,
    doneMilestones,
    overdueMilestones,
    nextMilestone,
  }
}

const CLOSED_STATUSES = new Set(['resolved', 'accepted', 'approved', 'declined'])

export function isOpenItem(item: TrackedItem): boolean {
  return !CLOSED_STATUSES.has(item.status)
}

export interface ItemSummary {
  openRisks: TrackedItem[]
  openBlockers: TrackedItem[]
  openChanges: TrackedItem[]
  /** Open risks and blockers rated high or critical. */
  highImpactOpen: TrackedItem[]
  overdueItems: TrackedItem[]
}

export function summarizeItems(items: TrackedItem[]): ItemSummary {
  const open = items.filter(isOpenItem)
  const severe = (item: TrackedItem) => item.impact === 'high' || item.impact === 'critical'

  return {
    openRisks: open.filter((item) => item.kind === 'risk'),
    openBlockers: open.filter((item) => item.kind === 'blocker'),
    openChanges: open.filter((item) => item.kind === 'change'),
    highImpactOpen: open.filter((item) => item.kind !== 'change' && severe(item)),
    overdueItems: open.filter((item) => isOverdue(item.dueDate)),
  }
}

/** Work that needs a person's attention now, sorted most urgent first. */
export function sortByUrgency(tasks: Task[]): Task[] {
  const priorityWeight: Record<Task['priority'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  return [...tasks].sort((a, b) => {
    const aDue = a.dueDate ? daysUntil(a.dueDate) : 9999
    const bDue = b.dueDate ? daysUntil(b.dueDate) : 9999
    if (aDue !== bDue) return aDue - bDue
    return priorityWeight[a.priority] - priorityWeight[b.priority]
  })
}
