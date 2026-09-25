import { describe, expect, it } from 'vitest'

import { shiftDays } from '@/lib/dates'
import { computeMetricSnapshot } from '@/lib/metrics'
import type { Goal, MetricReading } from '@/types'

function makeGoal(overrides: Partial<Goal['metric']> = {}, days = { start: -50, end: 50 }): Goal {
  return {
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
      ...overrides,
    },
    startDate: shiftDays(days.start),
    deadline: shiftDays(days.end),
    status: 'active',
    ownerId: 'p1',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function reading(dayOffset: number, value: number): MetricReading {
  return {
    id: `mr${dayOffset}`,
    goalId: 'g1',
    date: shiftDays(dayOffset),
    value,
    recordedById: 'p1',
  }
}

describe('computeMetricSnapshot', () => {
  it('reports no readings before anything has been measured', () => {
    const snapshot = computeMetricSnapshot(makeGoal(), [])

    expect(snapshot.status).toBe('not_started')
    expect(snapshot.current).toBe(80)
    expect(snapshot.attainment).toBe(0)
  })

  it('measures attainment as the share of the baseline-to-target distance covered', () => {
    const snapshot = computeMetricSnapshot(makeGoal(), [reading(-1, 90)])

    expect(snapshot.attainment).toBeCloseTo(0.5, 5)
    expect(snapshot.remaining).toBeCloseTo(10, 5)
  })

  it('calls a goal on pace when attainment keeps up with elapsed time', () => {
    // Half the window gone, half the distance covered.
    const snapshot = computeMetricSnapshot(makeGoal(), [reading(-1, 90)])

    expect(snapshot.elapsed).toBeCloseTo(0.5, 1)
    expect(snapshot.paceRatio).toBeCloseTo(1, 1)
    expect(snapshot.status).toBe('on_pace')
  })

  it('calls a goal behind when the metric lags the straight line to target', () => {
    const snapshot = computeMetricSnapshot(makeGoal(), [reading(-1, 83)])

    expect(snapshot.paceRatio).toBeLessThan(0.9)
    expect(snapshot.status).toBe('behind')
    expect(snapshot.expectedNow).toBeCloseTo(90, 0)
  })

  it('calls a goal ahead when the metric runs past the straight line', () => {
    const snapshot = computeMetricSnapshot(makeGoal(), [reading(-1, 97)])

    expect(snapshot.status).toBe('ahead')
  })

  it('handles metrics where lower is better', () => {
    const goal = makeGoal({ baseline: 10, target: 5, direction: 'decrease', unit: 'currency' })
    const snapshot = computeMetricSnapshot(goal, [reading(-1, 7.5)])

    expect(snapshot.attainment).toBeCloseTo(0.5, 5)
    expect(snapshot.remaining).toBeCloseTo(2.5, 5)
    expect(snapshot.status).toBe('on_pace')
  })

  it('reports the target as met once the number lands, whichever direction it moves', () => {
    expect(computeMetricSnapshot(makeGoal(), [reading(-1, 100)]).status).toBe('met')

    const falling = makeGoal({ baseline: 10, target: 5, direction: 'decrease' })
    expect(computeMetricSnapshot(falling, [reading(-1, 4.2)]).status).toBe('met')
  })

  it('reports the target as missed once the deadline passes without it', () => {
    const goal = makeGoal({}, { start: -100, end: -1 })
    const snapshot = computeMetricSnapshot(goal, [reading(-5, 92)])

    expect(snapshot.status).toBe('missed')
    expect(snapshot.daysRemaining).toBeLessThan(0)
  })

  it('tracks the change between the two most recent readings', () => {
    const snapshot = computeMetricSnapshot(makeGoal(), [reading(-14, 91), reading(-7, 89)])

    expect(snapshot.changeSinceLast).toBeCloseTo(-2, 5)
    expect(snapshot.changeSinceBaseline).toBeCloseTo(9, 5)
  })

  it('starts the history at the baseline so charts have somewhere to begin', () => {
    const snapshot = computeMetricSnapshot(makeGoal(), [reading(-7, 85)])

    expect(snapshot.history).toHaveLength(2)
    expect(snapshot.history[0]?.value).toBe(80)
  })
})
