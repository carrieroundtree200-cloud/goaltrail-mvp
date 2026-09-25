import { describe, expect, it } from 'vitest'

import { buildDemoWorkspace } from '@/data/seed'
import { shiftDays } from '@/lib/dates'
import { computeGoalHealth } from '@/lib/health'
import { computeMetricSnapshot } from '@/lib/metrics'
import { computePlanProgress, summarizeItems } from '@/lib/plan'
import { selectAllGoalViews } from '@/state/selectors'
import type { Goal, MetricReading, Milestone, Task, TrackedItem } from '@/types'

const now = new Date().toISOString()

const goal: Goal = {
  id: 'g1',
  title: 'Test goal',
  purpose: 'Because it matters.',
  beneficiary: 'Customers',
  metric: {
    name: 'On-time rate',
    unit: 'percent',
    baseline: 80,
    target: 100,
    direction: 'increase',
    source: 'Weekly export',
    cadence: 'weekly',
  },
  startDate: shiftDays(-50),
  deadline: shiftDays(50),
  status: 'active',
  ownerId: 'p1',
  tags: [],
  createdAt: now,
  updatedAt: now,
}

const onPaceReading: MetricReading[] = [
  { id: 'mr1', goalId: 'g1', date: shiftDays(-1), value: 90, recordedById: 'p1' },
]

function task(overrides: Partial<Task>): Task {
  return {
    id: `tk${Math.random()}`,
    goalId: 'g1',
    title: 'A task',
    status: 'todo',
    priority: 'medium',
    ownerId: 'p1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function item(overrides: Partial<TrackedItem>): TrackedItem {
  return {
    id: `it${Math.random()}`,
    goalId: 'g1',
    kind: 'risk',
    title: 'An item',
    detail: 'Some detail',
    impact: 'medium',
    status: 'open',
    ownerId: 'p1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function health(options: {
  readings?: MetricReading[]
  tasks?: Task[]
  milestones?: Milestone[]
  items?: TrackedItem[]
}) {
  const readings = options.readings ?? onPaceReading
  const tasks = options.tasks ?? []
  const milestones = options.milestones ?? []
  const items = options.items ?? []

  return computeGoalHealth(
    goal,
    computeMetricSnapshot(goal, readings),
    computePlanProgress(tasks, milestones),
    summarizeItems(items),
  )
}

describe('computeGoalHealth', () => {
  it('is on track when the metric keeps pace and nothing is in the way', () => {
    const result = health({ tasks: [task({ status: 'done' })] })

    expect(result.level).toBe('on_track')
    expect(result.reasons.every((reason) => reason.severity === 'good')).toBe(true)
  })

  it('always explains itself', () => {
    const result = health({})

    expect(result.reasons.length).toBeGreaterThan(0)
    for (const reason of result.reasons) {
      expect(reason.label.length).toBeGreaterThan(0)
      expect(reason.detail.length).toBeGreaterThan(0)
    }
  })

  it('is blocked when a high-impact blocker is open', () => {
    const result = health({ items: [item({ kind: 'blocker', impact: 'high' })] })

    expect(result.level).toBe('blocked')
    expect(result.reasons[0]?.id).toBe('severe-blocker')
  })

  it('is blocked when two blockers are open at once, whatever their impact', () => {
    const result = health({
      items: [
        item({ kind: 'blocker', impact: 'low' }),
        item({ kind: 'blocker', impact: 'medium' }),
      ],
    })

    expect(result.level).toBe('blocked')
  })

  it('is only at risk for a single lower-impact blocker', () => {
    const result = health({ items: [item({ kind: 'blocker', impact: 'medium' })] })

    expect(result.level).toBe('at_risk')
  })

  it('ignores blockers that have been resolved', () => {
    const result = health({
      items: [item({ kind: 'blocker', impact: 'critical', status: 'resolved' })],
    })

    expect(result.level).toBe('on_track')
  })

  it('is at risk when the metric falls well behind the pace needed', () => {
    const result = health({
      readings: [{ id: 'mr', goalId: 'g1', date: shiftDays(-1), value: 82, recordedById: 'p1' }],
    })

    expect(result.level).toBe('at_risk')
    expect(result.reasons.some((reason) => reason.id === 'well-behind-pace')).toBe(true)
  })

  it('is on watch when the metric slips only slightly behind', () => {
    const result = health({
      readings: [{ id: 'mr', goalId: 'g1', date: shiftDays(-1), value: 88, recordedById: 'p1' }],
    })

    expect(result.level).toBe('watch')
    expect(result.reasons.some((reason) => reason.id === 'slightly-behind-pace')).toBe(true)
  })

  it('notices when the metric moved the wrong way at the last reading', () => {
    const result = health({
      readings: [
        { id: 'a', goalId: 'g1', date: shiftDays(-14), value: 93, recordedById: 'p1' },
        { id: 'b', goalId: 'g1', date: shiftDays(-7), value: 91, recordedById: 'p1' },
      ],
    })

    expect(result.reasons.some((reason) => reason.id === 'metric-regressed')).toBe(true)
  })

  it('escalates from watch to at risk as overdue work piles up', () => {
    const overdue = () => task({ dueDate: shiftDays(-3) })

    expect(health({ tasks: [overdue()] }).level).toBe('watch')
    expect(health({ tasks: [overdue(), overdue(), overdue()] }).level).toBe('at_risk')
  })

  it('does not count completed work as overdue', () => {
    const result = health({ tasks: [task({ status: 'done', dueDate: shiftDays(-30) })] })

    expect(result.level).toBe('on_track')
  })

  it('treats a critical open risk as at risk, and a high one as watch', () => {
    expect(health({ items: [item({ impact: 'critical' })] }).level).toBe('at_risk')
    expect(health({ items: [item({ impact: 'high' })] }).level).toBe('watch')
  })

  it('takes the worst reason as the overall level', () => {
    const result = health({
      tasks: [task({ dueDate: shiftDays(-2) })],
      items: [item({ kind: 'blocker', impact: 'critical' })],
    })

    expect(result.level).toBe('blocked')
    expect(result.reasons.some((reason) => reason.id === 'few-overdue-tasks')).toBe(true)
  })
})

describe('the Northstar Logistics demo workspace', () => {
  const views = selectAllGoalViews(buildDemoWorkspace())

  it('covers all four health levels, so every state is visible in the demo', () => {
    const levels = views.map((view) => view.health.level)

    expect(new Set(levels).size).toBe(4)
  })

  it.each([
    ['g_ontime', 'watch'],
    ['g_sameday', 'blocked'],
    ['g_cost', 'at_risk'],
    ['g_retention', 'on_track'],
  ])('rates %s as %s', (goalId, expected) => {
    const view = views.find((candidate) => candidate.goal.id === goalId)

    expect(view?.health.level).toBe(expected)
  })

  it('keeps every task, milestone and meeting attached to a goal that exists', () => {
    const workspace = buildDemoWorkspace()
    const goalIds = new Set(workspace.goals.map((candidate) => candidate.id))
    const peopleIds = new Set(workspace.people.map((person) => person.id))

    for (const collection of [
      workspace.tasks,
      workspace.milestones,
      workspace.meetings,
      workspace.trackedItems,
      workspace.decisions,
      workspace.files,
      workspace.metricReadings,
      workspace.activity,
    ]) {
      for (const row of collection) {
        expect(goalIds.has(row.goalId)).toBe(true)
      }
    }

    for (const task of workspace.tasks) {
      expect(peopleIds.has(task.ownerId)).toBe(true)
    }
  })

  it('links every task milestone and meeting reference to a real row', () => {
    const workspace = buildDemoWorkspace()
    const milestoneIds = new Set(workspace.milestones.map((milestone) => milestone.id))
    const meetingIds = new Set(workspace.meetings.map((meeting) => meeting.id))

    for (const task of workspace.tasks) {
      if (task.milestoneId) expect(milestoneIds.has(task.milestoneId)).toBe(true)
      if (task.meetingId) expect(meetingIds.has(task.meetingId)).toBe(true)
    }
    for (const trackedItem of workspace.trackedItems) {
      if (trackedItem.raisedInMeetingId) {
        expect(meetingIds.has(trackedItem.raisedInMeetingId)).toBe(true)
      }
    }
  })

  it('gives every goal a baseline, a different target, and readings in between', () => {
    for (const view of views) {
      expect(view.goal.metric.baseline).not.toBe(view.goal.metric.target)
      expect(view.readings.length).toBeGreaterThan(2)
      expect(view.goal.deadline > view.goal.startDate).toBe(true)
    }
  })
})
