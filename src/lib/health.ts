import { daysUntil, describeDueDate, formatDate } from '@/lib/dates'
import { formatMetricValue, formatPercent, pluralize } from '@/lib/format'
import type { MetricSnapshot } from '@/lib/metrics'
import type { ItemSummary, PlanProgress } from '@/lib/plan'
import type { Goal } from '@/types'

/**
 * Goal health is the third, separate lens. It combines how the target is
 * tracking with what is getting in the way. Every health verdict carries the
 * list of reasons that produced it, so nobody has to guess why a goal turned
 * amber overnight.
 */
export type HealthLevel = 'on_track' | 'watch' | 'at_risk' | 'blocked'

export type ReasonSeverity = 'good' | 'watch' | 'at_risk' | 'blocked'

export interface HealthReason {
  id: string
  severity: ReasonSeverity
  /** Short headline, e.g. "Behind the pace needed". */
  label: string
  /** One sentence with the numbers behind it. */
  detail: string
}

export interface GoalHealth {
  level: HealthLevel
  /** The single sentence shown next to the badge. */
  headline: string
  reasons: HealthReason[]
}

export const healthLabel: Record<HealthLevel, string> = {
  on_track: 'On track',
  watch: 'Watch',
  at_risk: 'At risk',
  blocked: 'Blocked',
}

const severityRank: Record<ReasonSeverity, number> = {
  good: 0,
  watch: 1,
  at_risk: 2,
  blocked: 3,
}

const levelBySeverity: Record<ReasonSeverity, HealthLevel> = {
  good: 'on_track',
  watch: 'watch',
  at_risk: 'at_risk',
  blocked: 'blocked',
}

export function computeGoalHealth(
  goal: Goal,
  metric: MetricSnapshot,
  plan: PlanProgress,
  items: ItemSummary,
): GoalHealth {
  const reasons: HealthReason[] = []
  const unit = goal.metric.unit

  // --- Blockers stop everything, so they are weighed first. -------------------
  const severeBlockers = items.openBlockers.filter(
    (item) => item.impact === 'high' || item.impact === 'critical',
  )
  if (severeBlockers.length > 0) {
    reasons.push({
      id: 'severe-blocker',
      severity: 'blocked',
      label: `${pluralize(severeBlockers.length, 'high-impact blocker')} open`,
      detail: severeBlockers
        .slice(0, 2)
        .map((item) => item.title)
        .join(' · '),
    })
  } else if (items.openBlockers.length >= 2) {
    reasons.push({
      id: 'multiple-blockers',
      severity: 'blocked',
      label: `${items.openBlockers.length} blockers open at once`,
      detail: 'Several pieces of work cannot move until these are cleared.',
    })
  } else if (items.openBlockers.length === 1) {
    reasons.push({
      id: 'one-blocker',
      severity: 'at_risk',
      label: 'One blocker is open',
      detail: items.openBlockers[0]!.title,
    })
  }

  // --- Is the number going to land? -------------------------------------------
  if (metric.status === 'missed') {
    reasons.push({
      id: 'deadline-passed',
      severity: 'at_risk',
      label: 'Deadline passed without hitting the target',
      detail: `Finished at ${formatMetricValue(metric.current, unit)} against a target of ${formatMetricValue(metric.target, unit)}.`,
    })
  } else if (metric.status === 'met') {
    reasons.push({
      id: 'target-met',
      severity: 'good',
      label: 'Target already met',
      detail: `${formatMetricValue(metric.current, unit)} against a target of ${formatMetricValue(metric.target, unit)}.`,
    })
  } else if (metric.status === 'not_started') {
    reasons.push({
      id: 'no-readings',
      severity: 'watch',
      label: 'No metric readings yet',
      detail: 'Health cannot be judged until the first measurement is recorded.',
    })
  } else if (metric.paceRatio < 0.7) {
    reasons.push({
      id: 'well-behind-pace',
      severity: 'at_risk',
      label: 'Well behind the pace needed',
      detail: `At ${formatMetricValue(metric.current, unit)} with ${formatPercent(metric.elapsed)} of the time gone; a steady run would be at ${formatMetricValue(metric.expectedNow, unit)} by now.`,
    })
  } else if (metric.paceRatio < 0.95) {
    reasons.push({
      id: 'slightly-behind-pace',
      severity: 'watch',
      label: 'Slightly behind the pace needed',
      detail: `${formatMetricValue(metric.current, unit)} today versus ${formatMetricValue(metric.expectedNow, unit)} for a steady run to target.`,
    })
  } else {
    reasons.push({
      id: 'on-pace',
      severity: 'good',
      label: metric.status === 'ahead' ? 'Ahead of the pace needed' : 'Moving at the pace needed',
      detail: `${formatMetricValue(metric.current, unit)} today, target ${formatMetricValue(metric.target, unit)} by ${formatDate(goal.deadline)}.`,
    })
  }

  // --- Is the metric moving the wrong way? ------------------------------------
  const wrongWay =
    goal.metric.direction === 'increase' ? metric.changeSinceLast < 0 : metric.changeSinceLast > 0
  if (wrongWay && metric.previousReading && metric.status !== 'met') {
    reasons.push({
      id: 'metric-regressed',
      severity: 'watch',
      label: 'The metric moved the wrong way last reading',
      detail: `${formatMetricValue(metric.previousReading.value, unit)} on ${formatDate(metric.previousReading.date)} to ${formatMetricValue(metric.current, unit)} on ${formatDate(metric.latestReading!.date)}.`,
    })
  }

  // --- High-impact risks -------------------------------------------------------
  const criticalRisks = items.openRisks.filter((item) => item.impact === 'critical')
  const highRisks = items.openRisks.filter((item) => item.impact === 'high')
  if (criticalRisks.length > 0) {
    reasons.push({
      id: 'critical-risk',
      severity: 'at_risk',
      label: `${pluralize(criticalRisks.length, 'critical risk')} open`,
      detail: criticalRisks
        .slice(0, 2)
        .map((item) => item.title)
        .join(' · '),
    })
  } else if (highRisks.length > 0) {
    reasons.push({
      id: 'high-risk',
      severity: 'watch',
      label: `${pluralize(highRisks.length, 'high-impact risk')} open`,
      detail: highRisks
        .slice(0, 2)
        .map((item) => item.title)
        .join(' · '),
    })
  }

  // --- Is the plan slipping? ---------------------------------------------------
  if (plan.overdueTasks >= 3) {
    reasons.push({
      id: 'many-overdue-tasks',
      severity: 'at_risk',
      label: `${pluralize(plan.overdueTasks, 'task')} past their due date`,
      detail: 'The plan is slipping faster than the team is clearing it.',
    })
  } else if (plan.overdueTasks > 0) {
    reasons.push({
      id: 'few-overdue-tasks',
      severity: 'watch',
      label: `${pluralize(plan.overdueTasks, 'task')} past its due date`,
      detail: 'Worth a check-in before it spreads.',
    })
  }

  if (plan.blockedTasks >= 3) {
    reasons.push({
      id: 'many-blocked-tasks',
      severity: 'at_risk',
      label: `${pluralize(plan.blockedTasks, 'task')} sitting in Blocked`,
      detail: 'Work is piling up behind something the team cannot clear on its own.',
    })
  } else if (plan.blockedTasks > 0) {
    reasons.push({
      id: 'some-blocked-tasks',
      severity: 'watch',
      label: `${pluralize(plan.blockedTasks, 'task')} sitting in Blocked`,
      detail: 'Check the board for what each one is waiting on.',
    })
  }

  if (plan.overdueMilestones > 0) {
    reasons.push({
      id: 'overdue-milestone',
      severity: 'at_risk',
      label: `${pluralize(plan.overdueMilestones, 'milestone')} overdue`,
      detail: plan.nextMilestone
        ? `${plan.nextMilestone.title} — ${describeDueDate(plan.nextMilestone.dueDate)}.`
        : 'Re-plan the dates or cut scope.',
    })
  } else if (
    plan.nextMilestone &&
    plan.nextMilestone.status === 'not_started' &&
    daysUntil(plan.nextMilestone.dueDate) <= 10
  ) {
    reasons.push({
      id: 'milestone-not-started',
      severity: 'watch',
      label: 'Next milestone has not been started',
      detail: `${plan.nextMilestone.title} — ${describeDueDate(plan.nextMilestone.dueDate)}.`,
    })
  }

  // --- Pending change requests --------------------------------------------------
  const weightyChanges = items.openChanges.filter(
    (item) => item.impact === 'high' || item.impact === 'critical',
  )
  if (weightyChanges.length > 0) {
    reasons.push({
      id: 'pending-change',
      severity: 'watch',
      label: `${pluralize(weightyChanges.length, 'change')} waiting on a decision`,
      detail: weightyChanges
        .slice(0, 2)
        .map((item) => item.title)
        .join(' · '),
    })
  }

  const worst = reasons.reduce<ReasonSeverity>(
    (acc, reason) => (severityRank[reason.severity] > severityRank[acc] ? reason.severity : acc),
    'good',
  )
  const level = levelBySeverity[worst]
  const driver = reasons.find((reason) => reason.severity === worst)

  return {
    level,
    headline:
      level === 'on_track'
        ? (driver?.label ?? 'Nothing needs attention right now')
        : (driver?.label ?? healthLabel[level]),
    reasons: [...reasons].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]),
  }
}
