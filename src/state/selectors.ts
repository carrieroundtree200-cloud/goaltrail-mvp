import { computeGoalHealth, type GoalHealth } from '@/lib/health'
import { computeMetricSnapshot, type MetricSnapshot } from '@/lib/metrics'
import {
  computePlanProgress,
  summarizeItems,
  type ItemSummary,
  type PlanProgress,
} from '@/lib/plan'
import { toDate } from '@/lib/dates'
import type {
  ActivityEvent,
  Decision,
  FileLink,
  Goal,
  GoalMember,
  ID,
  Meeting,
  MetricReading,
  Milestone,
  Person,
  Task,
  TrackedItem,
  Workspace,
} from '@/types'

/** Everything one goal page needs, computed in one place. */
export interface GoalView {
  goal: Goal
  metric: MetricSnapshot
  plan: PlanProgress
  items: ItemSummary
  health: GoalHealth
  owner?: Person
  sponsor?: Person
  members: (GoalMember & { person?: Person })[]
  tasks: Task[]
  milestones: Milestone[]
  readings: MetricReading[]
  meetings: Meeting[]
  decisions: Decision[]
  allItems: TrackedItem[]
  files: FileLink[]
  activity: ActivityEvent[]
  latestMeeting?: Meeting
}

const byDateDesc = (a: { date: string }, b: { date: string }) =>
  toDate(b.date).getTime() - toDate(a.date).getTime()

export function selectGoalView(workspace: Workspace, goalId: ID): GoalView | undefined {
  const goal = workspace.goals.find((candidate) => candidate.id === goalId)
  if (!goal) return undefined

  const personById = (id?: ID) => workspace.people.find((person) => person.id === id)

  const tasks = workspace.tasks.filter((task) => task.goalId === goalId)
  const milestones = workspace.milestones
    .filter((milestone) => milestone.goalId === goalId)
    .sort((a, b) => a.order - b.order)
  const readings = workspace.metricReadings.filter((reading) => reading.goalId === goalId)
  const allItems = workspace.trackedItems.filter((item) => item.goalId === goalId)
  const meetings = workspace.meetings.filter((meeting) => meeting.goalId === goalId).sort(byDateDesc)

  const metric = computeMetricSnapshot(goal, readings)
  const plan = computePlanProgress(tasks, milestones)
  const items = summarizeItems(allItems)
  const health = computeGoalHealth(goal, metric, plan, items)

  return {
    goal,
    metric,
    plan,
    items,
    health,
    owner: personById(goal.ownerId),
    sponsor: personById(goal.sponsorId),
    members: workspace.goalMembers
      .filter((member) => member.goalId === goalId)
      .map((member) => ({ ...member, person: personById(member.personId) })),
    tasks,
    milestones,
    readings,
    meetings,
    decisions: workspace.decisions.filter((decision) => decision.goalId === goalId).sort(byDateDesc),
    allItems,
    files: workspace.files.filter((file) => file.goalId === goalId),
    activity: workspace.activity
      .filter((event) => event.goalId === goalId)
      .sort((a, b) => (a.at < b.at ? 1 : -1)),
    latestMeeting: meetings[0],
  }
}

export function selectAllGoalViews(workspace: Workspace): GoalView[] {
  return workspace.goals
    .map((goal) => selectGoalView(workspace, goal.id))
    .filter((view): view is GoalView => Boolean(view))
}

export function selectPerson(workspace: Workspace, id?: ID): Person | undefined {
  if (!id) return undefined
  return workspace.people.find((person) => person.id === id)
}

export function selectMeeting(workspace: Workspace, meetingId: ID) {
  const meeting = workspace.meetings.find((candidate) => candidate.id === meetingId)
  if (!meeting) return undefined
  return {
    meeting,
    goal: workspace.goals.find((goal) => goal.id === meeting.goalId),
    attendees: meeting.attendeeIds
      .map((id) => selectPerson(workspace, id))
      .filter((person): person is Person => Boolean(person)),
    decisions: workspace.decisions.filter((decision) => decision.meetingId === meetingId),
    items: workspace.trackedItems.filter((item) => item.raisedInMeetingId === meetingId),
    actionItems: workspace.tasks.filter((task) => task.meetingId === meetingId),
  }
}
