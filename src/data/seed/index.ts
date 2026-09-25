import { formatMetricValue } from '@/lib/format'
import type { ActivityEvent, Workspace } from '@/types'

import { at } from './helpers'
import type { GoalSlice } from './helpers'
import { costSlice } from './goal-cost'
import { ontimeSlice } from './goal-ontime'
import { people } from './people'
import { retentionSlice } from './goal-retention'
import { samedaySlice } from './goal-sameday'

const slices: GoalSlice[] = [ontimeSlice, samedaySlice, costSlice, retentionSlice]

const taskStatusWords: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

const itemKindWords: Record<string, string> = {
  risk: 'risk',
  blocker: 'blocker',
  change: 'change',
}

/**
 * The activity feed is derived from the rest of the demo data rather than
 * written by hand, so it can never drift out of step with it.
 */
function buildActivity(slice: GoalSlice): ActivityEvent[] {
  const { goal } = slice
  const events: ActivityEvent[] = []
  const push = (event: Omit<ActivityEvent, 'id' | 'goalId'>) =>
    events.push({ id: `ac_${goal.id}_${events.length + 1}`, goalId: goal.id, ...event })

  push({
    kind: 'goal_created',
    summary: `created the goal “${goal.title}”`,
    actorId: goal.ownerId,
    at: goal.createdAt,
  })

  for (const reading of slice.readings) {
    push({
      kind: 'metric_recorded',
      summary: `recorded ${goal.metric.name} at ${formatMetricValue(reading.value, goal.metric.unit)}`,
      actorId: reading.recordedById,
      at: `${reading.date}T08:00:00.000Z`,
    })
  }

  for (const task of slice.tasks) {
    if (task.status === 'done' && task.completedAt) {
      push({
        kind: 'task_status_changed',
        summary: `moved “${task.title}” to Done`,
        actorId: task.ownerId,
        at: task.completedAt,
      })
    } else if (task.status === 'in_progress' || task.status === 'blocked') {
      push({
        kind: 'task_status_changed',
        summary: `moved “${task.title}” to ${taskStatusWords[task.status]}`,
        actorId: task.ownerId,
        at: task.updatedAt,
      })
    } else {
      push({
        kind: 'task_created',
        summary: `added the task “${task.title}”`,
        actorId: task.ownerId,
        at: task.createdAt,
      })
    }
  }

  for (const milestone of slice.milestones) {
    if (milestone.status === 'done') {
      push({
        kind: 'milestone_updated',
        summary: `completed the milestone “${milestone.title}”`,
        actorId: milestone.ownerId,
        at: `${milestone.dueDate}T17:00:00.000Z`,
      })
    }
  }

  for (const meeting of slice.meetings) {
    push({
      kind: 'meeting_logged',
      summary: `logged minutes for “${meeting.title}”`,
      actorId: meeting.attendeeIds[0] ?? goal.ownerId,
      at: meeting.createdAt,
      meetingId: meeting.id,
    })
  }

  for (const decision of slice.decisions) {
    push({
      kind: 'decision_made',
      summary: `recorded the decision “${decision.title}”`,
      actorId: decision.decidedById,
      at: `${decision.date}T12:00:00.000Z`,
      meetingId: decision.meetingId,
    })
  }

  for (const item of slice.items) {
    push({
      kind: 'item_raised',
      summary: `raised the ${itemKindWords[item.kind]} “${item.title}”`,
      actorId: item.ownerId,
      at: item.createdAt,
      meetingId: item.raisedInMeetingId,
    })
    if (item.resolvedAt) {
      push({
        kind: 'item_updated',
        summary: `closed the ${itemKindWords[item.kind]} “${item.title}”`,
        actorId: item.ownerId,
        at: item.resolvedAt,
      })
    }
  }

  for (const file of slice.files) {
    push({
      kind: 'file_linked',
      summary: `linked “${file.name}”`,
      actorId: file.addedById,
      at: file.addedAt,
    })
  }

  return events
}

/** Build the Northstar Logistics demo workspace, dated relative to today. */
export function buildDemoWorkspace(): Workspace {
  const activity = slices
    .flatMap(buildActivity)
    .filter((event) => event.at <= at(0, 23, 59))
    .sort((a, b) => (a.at < b.at ? 1 : -1))

  return {
    people,
    goals: slices.map((slice) => slice.goal),
    goalMembers: slices.flatMap((slice) => slice.members),
    metricReadings: slices.flatMap((slice) => slice.readings),
    milestones: slices.flatMap((slice) => slice.milestones),
    tasks: slices.flatMap((slice) => slice.tasks),
    meetings: slices.flatMap((slice) => slice.meetings),
    decisions: slices.flatMap((slice) => slice.decisions),
    trackedItems: slices.flatMap((slice) => slice.items),
    files: slices.flatMap((slice) => slice.files),
    activity,
  }
}

export { DEMO_PERSON_ID, people } from './people'
