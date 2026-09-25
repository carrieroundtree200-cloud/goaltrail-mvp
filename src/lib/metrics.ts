import { clamp01, daysUntil, elapsedFraction, toDate } from '@/lib/dates'
import type { Goal, MetricReading } from '@/types'

/**
 * How the target is tracking. This is the only place that answers
 * "are we going to hit the number?" — it deliberately knows nothing about
 * tasks, milestones or meetings.
 */
export type TargetStatus = 'met' | 'ahead' | 'on_pace' | 'behind' | 'missed' | 'not_started'

export interface MetricSnapshot {
  goalId: string
  /** Most recent reading, or the baseline if nothing has been recorded yet. */
  current: number
  baseline: number
  target: number
  latestReading?: MetricReading
  previousReading?: MetricReading
  /** Change between the two most recent readings, in metric units. */
  changeSinceLast: number
  /** Change from the baseline, in metric units. */
  changeSinceBaseline: number
  /** 0–1+ share of the baseline→target distance covered. Can exceed 1. */
  attainment: number
  /** 0–1 share of the goal's calendar window that has elapsed. */
  elapsed: number
  /** Where the metric would sit today on a straight line from baseline to target. */
  expectedNow: number
  /** attainment ÷ elapsed. 1.0 means exactly on the straight line. */
  paceRatio: number
  /** Metric units still to cover between current and target. */
  remaining: number
  /** Units per week needed from today to land on target by the deadline. */
  requiredWeeklyRate: number
  daysRemaining: number
  status: TargetStatus
  /** Readings oldest-first, with a synthetic baseline point at the start date. */
  history: { date: string; value: number; note?: string }[]
}

function orderedReadings(readings: MetricReading[], goalId: string): MetricReading[] {
  return readings
    .filter((reading) => reading.goalId === goalId)
    .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
}

/** Signed so that "more is better" regardless of the metric's direction. */
function towardTarget(goal: Goal, from: number, to: number): number {
  return goal.metric.direction === 'increase' ? to - from : from - to
}

export function computeMetricSnapshot(goal: Goal, readings: MetricReading[]): MetricSnapshot {
  const { baseline, target, direction } = goal.metric
  const ordered = orderedReadings(readings, goal.id)
  const latestReading = ordered[ordered.length - 1]
  const previousReading = ordered[ordered.length - 2]
  const current = latestReading?.value ?? baseline

  const span = Math.abs(target - baseline)
  const covered = towardTarget(goal, baseline, current)
  const attainment = span === 0 ? (covered >= 0 ? 1 : 0) : covered / span

  const elapsed = elapsedFraction(goal.startDate, goal.deadline)
  const expectedNow = baseline + (target - baseline) * elapsed
  const paceRatio = elapsed <= 0.02 ? (attainment > 0 ? 2 : 1) : attainment / elapsed

  const remaining = Math.max(0, towardTarget(goal, current, target))
  const daysRemaining = daysUntil(goal.deadline)
  const weeksRemaining = Math.max(daysRemaining, 1) / 7
  const requiredWeeklyRate = remaining / weeksRemaining

  const reachedTarget = direction === 'increase' ? current >= target : current <= target

  let status: TargetStatus
  if (reachedTarget) {
    status = 'met'
  } else if (daysRemaining < 0) {
    status = 'missed'
  } else if (!latestReading) {
    status = 'not_started'
  } else if (paceRatio >= 1.05) {
    status = 'ahead'
  } else if (paceRatio >= 0.9) {
    status = 'on_pace'
  } else {
    status = 'behind'
  }

  return {
    goalId: goal.id,
    current,
    baseline,
    target,
    latestReading,
    previousReading,
    changeSinceLast: previousReading ? current - previousReading.value : 0,
    changeSinceBaseline: current - baseline,
    attainment,
    elapsed,
    expectedNow,
    paceRatio,
    remaining,
    requiredWeeklyRate,
    daysRemaining,
    status,
    history: [
      { date: goal.startDate, value: baseline, note: 'Baseline at kick-off' },
      ...ordered.map((reading) => ({
        date: reading.date,
        value: reading.value,
        note: reading.note,
      })),
    ],
  }
}

export const targetStatusLabel: Record<TargetStatus, string> = {
  met: 'Target met',
  ahead: 'Ahead of pace',
  on_pace: 'On pace',
  behind: 'Behind pace',
  missed: 'Target missed',
  not_started: 'No readings yet',
}

/** Position of a value on the baseline→target axis, for meters and charts. */
export function progressBarFraction(snapshot: MetricSnapshot): number {
  return clamp01(snapshot.attainment)
}

export function expectedMarkerFraction(snapshot: MetricSnapshot): number {
  return clamp01(snapshot.elapsed)
}
