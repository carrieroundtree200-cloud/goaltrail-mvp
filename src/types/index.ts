/**
 * The GoalTrail domain model.
 *
 * A note on the central idea: a goal succeeds when its real-world target metric
 * is met by its deadline. Plan progress (milestones and tasks) is how a team
 * intends to get there, and it is tracked separately on purpose. The two are
 * never merged into a single "percent complete" number anywhere in the app.
 */

export type ID = string

/** ISO-8601 date, no time component: `2026-09-25`. */
export type DateOnly = string

/** ISO-8601 timestamp: `2026-09-25T14:03:00.000Z`. */
export type Timestamp = string

// -----------------------------------------------------------------------------
// People
// -----------------------------------------------------------------------------

export interface Person {
  id: ID
  name: string
  jobTitle: string
  email: string
  /** Two-letter initials used by the avatar component. */
  initials: string
}

/** How one person is involved in one goal. */
export type GoalRole = 'owner' | 'sponsor' | 'contributor' | 'reviewer'

export interface GoalMember {
  id: ID
  goalId: ID
  personId: ID
  role: GoalRole
  /** Plain-language description of what this person is accountable for. */
  responsibility: string
}

// -----------------------------------------------------------------------------
// Goals and their target metric
// -----------------------------------------------------------------------------

export type MetricUnit = 'percent' | 'currency' | 'count' | 'days' | 'hours' | 'rating'

/** Whether hitting the target means going up or down from the baseline. */
export type MetricDirection = 'increase' | 'decrease'

export interface GoalMetric {
  /** Plain-language name, e.g. "On-time delivery rate". */
  name: string
  unit: MetricUnit
  /** Where the metric stood when the goal started. */
  baseline: number
  /** Where the metric needs to land by the deadline. */
  target: number
  direction: MetricDirection
  /** How the number is collected, e.g. "Weekly dispatch export". */
  source: string
  /** How often a new reading is expected. */
  cadence: 'daily' | 'weekly' | 'biweekly' | 'monthly'
}

export type GoalStatus = 'active' | 'paused' | 'achieved' | 'missed' | 'archived'

export interface Goal {
  id: ID
  title: string
  /** Why this goal matters, in the team's own words. */
  purpose: string
  /** Who or what is affected if it succeeds. */
  beneficiary: string
  metric: GoalMetric
  startDate: DateOnly
  deadline: DateOnly
  status: GoalStatus
  ownerId: ID
  sponsorId?: ID
  tags: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** One observation of the target metric on a given date. */
export interface MetricReading {
  id: ID
  goalId: ID
  date: DateOnly
  value: number
  note?: string
  recordedById: ID
}

// -----------------------------------------------------------------------------
// Plan: milestones and tasks
// -----------------------------------------------------------------------------

export type MilestoneStatus = 'not_started' | 'in_progress' | 'done' | 'at_risk'

export interface Milestone {
  id: ID
  goalId: ID
  title: string
  detail: string
  dueDate: DateOnly
  status: MilestoneStatus
  ownerId: ID
  order: number
}

/** The five work board columns. */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: ID
  goalId: ID
  milestoneId?: ID
  /** Set when the task was agreed as an action item in a meeting. */
  meetingId?: ID
  title: string
  detail?: string
  status: TaskStatus
  priority: TaskPriority
  ownerId: ID
  dueDate?: DateOnly
  /** Required in the UI when status is `blocked`, so the board explains itself. */
  blockedReason?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
}

// -----------------------------------------------------------------------------
// Meetings, decisions, risks and changes
// -----------------------------------------------------------------------------

export interface Meeting {
  id: ID
  goalId: ID
  title: string
  date: DateOnly
  startTime: string
  durationMinutes: number
  location: string
  attendeeIds: ID[]
  agenda: string[]
  /** Concise minutes. Short paragraphs, written by a person, not a transcript. */
  minutes: string
  /** The one-paragraph answer to "what changed because we met?". */
  whatChanged: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Decision {
  id: ID
  goalId: ID
  meetingId?: ID
  title: string
  detail: string
  decidedById: ID
  date: DateOnly
  /** What this decision affects downstream. */
  consequence: string
}

export type TrackedItemKind = 'risk' | 'blocker' | 'change'

export type ItemImpact = 'low' | 'medium' | 'high' | 'critical'

export type TrackedItemStatus =
  | 'open'
  | 'monitoring'
  | 'mitigating'
  | 'resolved'
  | 'accepted'
  | 'approved'
  | 'declined'

/** A risk, a blocker, or a change request — they share one shape and one register. */
export interface TrackedItem {
  id: ID
  goalId: ID
  kind: TrackedItemKind
  title: string
  detail: string
  impact: ItemImpact
  status: TrackedItemStatus
  ownerId: ID
  dueDate?: DateOnly
  /** For risks and blockers: the plan to reduce or remove it. */
  response?: string
  /** For changes: what the goal looked like before, in plain language. */
  previously?: string
  raisedInMeetingId?: ID
  createdAt: Timestamp
  updatedAt: Timestamp
  resolvedAt?: Timestamp
}

// -----------------------------------------------------------------------------
// Files (links only in this prototype — uploads are intentionally out of scope)
// -----------------------------------------------------------------------------

export type FileKind = 'doc' | 'sheet' | 'slides' | 'pdf' | 'dashboard' | 'link'

export interface FileLink {
  id: ID
  goalId: ID
  name: string
  kind: FileKind
  url: string
  description: string
  addedById: ID
  addedAt: Timestamp
}

// -----------------------------------------------------------------------------
// Activity
// -----------------------------------------------------------------------------

export type ActivityKind =
  | 'goal_created'
  | 'goal_updated'
  | 'metric_recorded'
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'milestone_updated'
  | 'meeting_logged'
  | 'meeting_updated'
  | 'decision_made'
  | 'item_raised'
  | 'item_updated'
  | 'file_linked'

export interface ActivityEvent {
  id: ID
  goalId: ID
  kind: ActivityKind
  /** Reads as a sentence: "moved Reroute evening runs to In progress". */
  summary: string
  actorId: ID
  at: Timestamp
  meetingId?: ID
}

// -----------------------------------------------------------------------------
// The workspace: everything the prototype persists
// -----------------------------------------------------------------------------

export interface Workspace {
  people: Person[]
  goals: Goal[]
  goalMembers: GoalMember[]
  metricReadings: MetricReading[]
  milestones: Milestone[]
  tasks: Task[]
  meetings: Meeting[]
  decisions: Decision[]
  trackedItems: TrackedItem[]
  files: FileLink[]
  activity: ActivityEvent[]
}

export interface Session {
  personId: ID
  signedInAt: Timestamp
  mode: 'demo' | 'account'
}
