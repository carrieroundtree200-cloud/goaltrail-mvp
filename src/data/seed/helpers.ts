import { shiftDays, shiftDaysTimestamp } from '@/lib/dates'
import type {
  DateOnly,
  Goal,
  GoalMember,
  ID,
  MetricReading,
  Milestone,
  Task,
  Timestamp,
  TrackedItem,
} from '@/types'

/** A calendar date N days from today (negative is in the past). */
export const day = (offset: number): DateOnly => shiftDays(offset)

/** A timestamp N days from today, at a plausible hour of the working day. */
export const at = (offset: number, hour = 9, minute = 0): Timestamp =>
  shiftDaysTimestamp(offset, hour, minute)

/** One slice of the demo workspace, contributed by a single goal. */
export interface GoalSlice {
  goal: Goal
  members: GoalMember[]
  readings: MetricReading[]
  milestones: Milestone[]
  tasks: Task[]
  meetings: import('@/types').Meeting[]
  decisions: import('@/types').Decision[]
  items: TrackedItem[]
  files: import('@/types').FileLink[]
}

export function members(
  goalId: ID,
  rows: [personId: ID, role: GoalMember['role'], responsibility: string][],
): GoalMember[] {
  return rows.map(([personId, role, responsibility], index) => ({
    id: `gm_${goalId}_${index + 1}`,
    goalId,
    personId,
    role,
    responsibility,
  }))
}

export function readings(
  goalId: ID,
  recordedById: ID,
  rows: [dayOffset: number, value: number, note?: string][],
): MetricReading[] {
  return rows.map(([offset, value, note], index) => ({
    id: `mr_${goalId}_${index + 1}`,
    goalId,
    date: day(offset),
    value,
    note,
    recordedById,
  }))
}

export function milestones(
  goalId: ID,
  rows: {
    key: string
    title: string
    detail: string
    dueIn: number
    status: Milestone['status']
    ownerId: ID
  }[],
): Milestone[] {
  return rows.map((row, index) => ({
    id: `ms_${goalId}_${row.key}`,
    goalId,
    title: row.title,
    detail: row.detail,
    dueDate: day(row.dueIn),
    status: row.status,
    ownerId: row.ownerId,
    order: index + 1,
  }))
}

export interface TaskSeed {
  key: string
  title: string
  detail?: string
  status: Task['status']
  priority: Task['priority']
  ownerId: ID
  dueIn?: number
  milestoneKey?: string
  meetingKey?: string
  blockedReason?: string
  createdDaysAgo: number
  updatedDaysAgo?: number
  completedDaysAgo?: number
}

export function tasks(goalId: ID, rows: TaskSeed[]): Task[] {
  return rows.map((row) => ({
    id: `tk_${goalId}_${row.key}`,
    goalId,
    milestoneId: row.milestoneKey ? `ms_${goalId}_${row.milestoneKey}` : undefined,
    meetingId: row.meetingKey ? `mt_${goalId}_${row.meetingKey}` : undefined,
    title: row.title,
    detail: row.detail,
    status: row.status,
    priority: row.priority,
    ownerId: row.ownerId,
    dueDate: row.dueIn === undefined ? undefined : day(row.dueIn),
    blockedReason: row.blockedReason,
    createdAt: at(-row.createdDaysAgo, 10, 15),
    updatedAt: at(-(row.updatedDaysAgo ?? row.createdDaysAgo), 15, 40),
    completedAt:
      row.completedDaysAgo === undefined ? undefined : at(-row.completedDaysAgo, 16, 20),
  }))
}

export interface ItemSeed {
  key: string
  kind: TrackedItem['kind']
  title: string
  detail: string
  impact: TrackedItem['impact']
  status: TrackedItem['status']
  ownerId: ID
  dueIn?: number
  response?: string
  previously?: string
  meetingKey?: string
  raisedDaysAgo: number
  updatedDaysAgo?: number
  resolvedDaysAgo?: number
}

export function items(goalId: ID, rows: ItemSeed[]): TrackedItem[] {
  return rows.map((row) => ({
    id: `it_${goalId}_${row.key}`,
    goalId,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    impact: row.impact,
    status: row.status,
    ownerId: row.ownerId,
    dueDate: row.dueIn === undefined ? undefined : day(row.dueIn),
    response: row.response,
    previously: row.previously,
    raisedInMeetingId: row.meetingKey ? `mt_${goalId}_${row.meetingKey}` : undefined,
    createdAt: at(-row.raisedDaysAgo, 11, 0),
    updatedAt: at(-(row.updatedDaysAgo ?? row.raisedDaysAgo), 14, 30),
    resolvedAt: row.resolvedDaysAgo === undefined ? undefined : at(-row.resolvedDaysAgo, 17, 0),
  }))
}
