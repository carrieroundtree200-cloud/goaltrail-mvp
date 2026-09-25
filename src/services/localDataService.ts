import { buildDemoWorkspace } from '@/data/seed'
import { nowTimestamp } from '@/lib/dates'
import { createId } from '@/lib/ids'
import { readJson, removeKey, writeJson } from '@/services/storage'
import type {
  ActivityEvent,
  ActivityKind,
  Decision,
  FileLink,
  Goal,
  GoalMember,
  ID,
  Meeting,
  MetricReading,
  Milestone,
  Session,
  Task,
  TrackedItem,
  Workspace,
} from '@/types'

import type {
  DataService,
  MutationResult,
  NewDecisionInput,
  NewFileLinkInput,
  NewGoalInput,
  NewMeetingInput,
  NewMetricReadingInput,
  NewTaskInput,
  NewTrackedItemInput,
} from './dataService'

const WORKSPACE_KEY = 'goaltrail.workspace.v1'
const SESSION_KEY = 'goaltrail.session.v1'

/** A small delay so loading states are real rather than decorative. */
const LOAD_DELAY_MS = 220

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T)
}

const TASK_STATUS_WORDS: Record<Task['status'], string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

export class LocalDataService implements DataService {
  #cache?: Workspace

  // --- Internals ---------------------------------------------------------------

  #read(): Workspace {
    if (this.#cache) return this.#cache
    const stored = readJson<Workspace>(WORKSPACE_KEY)
    const workspace = stored ?? buildDemoWorkspace()
    if (!stored) writeJson(WORKSPACE_KEY, workspace)
    this.#cache = workspace
    return workspace
  }

  #commit(workspace: Workspace): Workspace {
    this.#cache = workspace
    writeJson(WORKSPACE_KEY, workspace)
    return clone(workspace)
  }

  #logActivity(
    workspace: Workspace,
    goalId: ID,
    kind: ActivityKind,
    summary: string,
    actorId: ID,
    meetingId?: ID,
  ): Workspace {
    const event: ActivityEvent = {
      id: createId('ac'),
      goalId,
      kind,
      summary,
      actorId,
      at: nowTimestamp(),
      meetingId,
    }
    return { ...workspace, activity: [event, ...workspace.activity] }
  }

  #result<T>(workspace: Workspace, entity: T): MutationResult<T> {
    return { workspace: this.#commit(workspace), entity: clone(entity) }
  }

  // --- Workspace ----------------------------------------------------------------

  async loadWorkspace(): Promise<Workspace> {
    await delay(LOAD_DELAY_MS)
    return clone(this.#read())
  }

  async resetWorkspace(): Promise<Workspace> {
    removeKey(WORKSPACE_KEY)
    this.#cache = undefined
    const fresh = buildDemoWorkspace()
    await delay(120)
    return this.#commit(fresh)
  }

  // --- Session -------------------------------------------------------------------

  async getSession(): Promise<Session | undefined> {
    return readJson<Session>(SESSION_KEY)
  }

  async signIn(personId: ID, mode: Session['mode']): Promise<Session> {
    const session: Session = { personId, mode, signedInAt: nowTimestamp() }
    writeJson(SESSION_KEY, session)
    return session
  }

  async signOut(): Promise<void> {
    removeKey(SESSION_KEY)
  }

  // --- Goals -----------------------------------------------------------------------

  async createGoal(input: NewGoalInput, actorId: ID): Promise<MutationResult<Goal>> {
    const now = nowTimestamp()
    const { initialReading, milestones: milestoneDrafts, members: memberDrafts, ...rest } = input
    const goal: Goal = {
      ...rest,
      id: createId('goal'),
      status: rest.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    }

    let workspace = this.#read()
    workspace = { ...workspace, goals: [...workspace.goals, goal] }

    const ownerMember: GoalMember = {
      id: createId('gm'),
      goalId: goal.id,
      personId: goal.ownerId,
      role: 'owner',
      responsibility: 'Runs the goal end to end',
    }
    const extraMembers: GoalMember[] = (memberDrafts ?? [])
      .filter((member) => member.personId !== goal.ownerId)
      .map((member) => ({ id: createId('gm'), goalId: goal.id, ...member }))
    workspace = {
      ...workspace,
      goalMembers: [...workspace.goalMembers, ownerMember, ...extraMembers],
    }

    if (milestoneDrafts?.length) {
      const created: Milestone[] = milestoneDrafts.map((draft, index) => ({
        id: createId('ms'),
        goalId: goal.id,
        title: draft.title,
        detail: draft.detail,
        dueDate: draft.dueDate,
        status: 'not_started',
        ownerId: draft.ownerId,
        order: index + 1,
      }))
      workspace = { ...workspace, milestones: [...workspace.milestones, ...created] }
    }

    if (initialReading) {
      const reading: MetricReading = {
        id: createId('mr'),
        goalId: goal.id,
        date: initialReading.date,
        value: initialReading.value,
        note: initialReading.note,
        recordedById: actorId,
      }
      workspace = { ...workspace, metricReadings: [...workspace.metricReadings, reading] }
    }

    workspace = this.#logActivity(
      workspace,
      goal.id,
      'goal_created',
      `created the goal “${goal.title}”`,
      actorId,
    )
    return this.#result(workspace, goal)
  }

  async updateGoal(id: ID, patch: Partial<Goal>, actorId: ID): Promise<MutationResult<Goal>> {
    const workspace = this.#read()
    const existing = workspace.goals.find((goal) => goal.id === id)
    if (!existing) throw new Error(`Goal ${id} was not found.`)

    const updated: Goal = { ...existing, ...patch, id, updatedAt: nowTimestamp() }
    let next: Workspace = {
      ...workspace,
      goals: workspace.goals.map((goal) => (goal.id === id ? updated : goal)),
    }
    next = this.#logActivity(next, id, 'goal_updated', 'updated the goal details', actorId)
    return this.#result(next, updated)
  }

  // --- Metric readings -------------------------------------------------------------

  async recordMetricReading(
    input: NewMetricReadingInput,
  ): Promise<MutationResult<MetricReading>> {
    const workspace = this.#read()
    const goal = workspace.goals.find((item) => item.id === input.goalId)
    const reading: MetricReading = { ...input, id: createId('mr') }
    let next: Workspace = {
      ...workspace,
      metricReadings: [...workspace.metricReadings, reading],
    }
    next = this.#logActivity(
      next,
      input.goalId,
      'metric_recorded',
      `recorded ${goal?.metric.name ?? 'the metric'} at ${reading.value}`,
      input.recordedById,
    )
    return this.#result(next, reading)
  }

  // --- Milestones --------------------------------------------------------------------

  async createMilestone(
    input: Omit<Milestone, 'id' | 'order'> & { order?: number },
    actorId: ID,
  ): Promise<MutationResult<Milestone>> {
    const workspace = this.#read()
    const siblings = workspace.milestones.filter((item) => item.goalId === input.goalId)
    const milestone: Milestone = {
      ...input,
      id: createId('ms'),
      order: input.order ?? siblings.length + 1,
    }
    let next: Workspace = { ...workspace, milestones: [...workspace.milestones, milestone] }
    next = this.#logActivity(
      next,
      input.goalId,
      'milestone_updated',
      `added the milestone “${milestone.title}”`,
      actorId,
    )
    return this.#result(next, milestone)
  }

  async updateMilestone(
    id: ID,
    patch: Partial<Milestone>,
    actorId: ID,
  ): Promise<MutationResult<Milestone>> {
    const workspace = this.#read()
    const existing = workspace.milestones.find((item) => item.id === id)
    if (!existing) throw new Error(`Milestone ${id} was not found.`)
    const updated: Milestone = { ...existing, ...patch, id }
    let next: Workspace = {
      ...workspace,
      milestones: workspace.milestones.map((item) => (item.id === id ? updated : item)),
    }
    const changedStatus = patch.status && patch.status !== existing.status
    next = this.#logActivity(
      next,
      updated.goalId,
      'milestone_updated',
      changedStatus
        ? `marked the milestone “${updated.title}” as ${updated.status.replaceAll('_', ' ')}`
        : `updated the milestone “${updated.title}”`,
      actorId,
    )
    return this.#result(next, updated)
  }

  async deleteMilestone(id: ID, actorId: ID): Promise<Workspace> {
    const workspace = this.#read()
    const existing = workspace.milestones.find((item) => item.id === id)
    if (!existing) return clone(workspace)
    let next: Workspace = {
      ...workspace,
      milestones: workspace.milestones.filter((item) => item.id !== id),
      tasks: workspace.tasks.map((task) =>
        task.milestoneId === id ? { ...task, milestoneId: undefined } : task,
      ),
    }
    next = this.#logActivity(
      next,
      existing.goalId,
      'milestone_updated',
      `removed the milestone “${existing.title}”`,
      actorId,
    )
    return this.#commit(next)
  }

  // --- Tasks ---------------------------------------------------------------------------

  async createTask(input: NewTaskInput, actorId: ID): Promise<MutationResult<Task>> {
    const now = nowTimestamp()
    const task: Task = {
      ...input,
      id: createId('tk'),
      createdAt: now,
      updatedAt: now,
      completedAt: input.status === 'done' ? now : undefined,
    }
    let next: Workspace = { ...this.#read(), tasks: [...this.#read().tasks, task] }
    next = this.#logActivity(
      next,
      task.goalId,
      'task_created',
      `added the task “${task.title}”`,
      actorId,
    )
    return this.#result(next, task)
  }

  async updateTask(id: ID, patch: Partial<Task>, actorId: ID): Promise<MutationResult<Task>> {
    const workspace = this.#read()
    const existing = workspace.tasks.find((task) => task.id === id)
    if (!existing) throw new Error(`Task ${id} was not found.`)

    const statusChanged = patch.status !== undefined && patch.status !== existing.status
    const updated: Task = {
      ...existing,
      ...patch,
      id,
      updatedAt: nowTimestamp(),
      blockedReason: (patch.status ?? existing.status) === 'blocked'
        ? (patch.blockedReason ?? existing.blockedReason)
        : undefined,
      completedAt:
        (patch.status ?? existing.status) === 'done'
          ? (existing.completedAt ?? nowTimestamp())
          : undefined,
    }

    let next: Workspace = {
      ...workspace,
      tasks: workspace.tasks.map((task) => (task.id === id ? updated : task)),
    }
    next = this.#logActivity(
      next,
      updated.goalId,
      statusChanged ? 'task_status_changed' : 'task_updated',
      statusChanged
        ? `moved “${updated.title}” to ${TASK_STATUS_WORDS[updated.status]}`
        : `updated the task “${updated.title}”`,
      actorId,
    )
    return this.#result(next, updated)
  }

  async deleteTask(id: ID, actorId: ID): Promise<Workspace> {
    const workspace = this.#read()
    const existing = workspace.tasks.find((task) => task.id === id)
    if (!existing) return clone(workspace)
    let next: Workspace = {
      ...workspace,
      tasks: workspace.tasks.filter((task) => task.id !== id),
    }
    next = this.#logActivity(
      next,
      existing.goalId,
      'task_updated',
      `removed the task “${existing.title}”`,
      actorId,
    )
    return this.#commit(next)
  }

  // --- Meetings ----------------------------------------------------------------------------

  async createMeeting(input: NewMeetingInput, actorId: ID): Promise<MutationResult<Meeting>> {
    const now = nowTimestamp()
    const meeting: Meeting = { ...input, id: createId('mt'), createdAt: now, updatedAt: now }
    let next: Workspace = { ...this.#read(), meetings: [...this.#read().meetings, meeting] }
    next = this.#logActivity(
      next,
      meeting.goalId,
      'meeting_logged',
      `logged minutes for “${meeting.title}”`,
      actorId,
      meeting.id,
    )
    return this.#result(next, meeting)
  }

  async updateMeeting(
    id: ID,
    patch: Partial<Meeting>,
    actorId: ID,
  ): Promise<MutationResult<Meeting>> {
    const workspace = this.#read()
    const existing = workspace.meetings.find((meeting) => meeting.id === id)
    if (!existing) throw new Error(`Meeting ${id} was not found.`)
    const updated: Meeting = { ...existing, ...patch, id, updatedAt: nowTimestamp() }
    let next: Workspace = {
      ...workspace,
      meetings: workspace.meetings.map((meeting) => (meeting.id === id ? updated : meeting)),
    }
    next = this.#logActivity(
      next,
      updated.goalId,
      'meeting_updated',
      `updated the notes for “${updated.title}”`,
      actorId,
      updated.id,
    )
    return this.#result(next, updated)
  }

  async deleteMeeting(id: ID, actorId: ID): Promise<Workspace> {
    const workspace = this.#read()
    const existing = workspace.meetings.find((meeting) => meeting.id === id)
    if (!existing) return clone(workspace)
    let next: Workspace = {
      ...workspace,
      meetings: workspace.meetings.filter((meeting) => meeting.id !== id),
      decisions: workspace.decisions.map((decision) =>
        decision.meetingId === id ? { ...decision, meetingId: undefined } : decision,
      ),
      trackedItems: workspace.trackedItems.map((item) =>
        item.raisedInMeetingId === id ? { ...item, raisedInMeetingId: undefined } : item,
      ),
    }
    next = this.#logActivity(
      next,
      existing.goalId,
      'meeting_updated',
      `removed the meeting “${existing.title}”`,
      actorId,
    )
    return this.#commit(next)
  }

  // --- Decisions ------------------------------------------------------------------------------

  async createDecision(input: NewDecisionInput, actorId: ID): Promise<MutationResult<Decision>> {
    const decision: Decision = { ...input, id: createId('dc') }
    let next: Workspace = { ...this.#read(), decisions: [...this.#read().decisions, decision] }
    next = this.#logActivity(
      next,
      decision.goalId,
      'decision_made',
      `recorded the decision “${decision.title}”`,
      actorId,
      decision.meetingId,
    )
    return this.#result(next, decision)
  }

  async deleteDecision(id: ID, actorId: ID): Promise<Workspace> {
    const workspace = this.#read()
    const existing = workspace.decisions.find((decision) => decision.id === id)
    if (!existing) return clone(workspace)
    let next: Workspace = {
      ...workspace,
      decisions: workspace.decisions.filter((decision) => decision.id !== id),
    }
    next = this.#logActivity(
      next,
      existing.goalId,
      'decision_made',
      `removed the decision “${existing.title}”`,
      actorId,
    )
    return this.#commit(next)
  }

  // --- Risks, blockers and changes ---------------------------------------------------------------

  async createTrackedItem(
    input: NewTrackedItemInput,
    actorId: ID,
  ): Promise<MutationResult<TrackedItem>> {
    const now = nowTimestamp()
    const item: TrackedItem = { ...input, id: createId('it'), createdAt: now, updatedAt: now }
    let next: Workspace = {
      ...this.#read(),
      trackedItems: [...this.#read().trackedItems, item],
    }
    next = this.#logActivity(
      next,
      item.goalId,
      'item_raised',
      `raised the ${item.kind} “${item.title}”`,
      actorId,
      item.raisedInMeetingId,
    )
    return this.#result(next, item)
  }

  async updateTrackedItem(
    id: ID,
    patch: Partial<TrackedItem>,
    actorId: ID,
  ): Promise<MutationResult<TrackedItem>> {
    const workspace = this.#read()
    const existing = workspace.trackedItems.find((item) => item.id === id)
    if (!existing) throw new Error(`Item ${id} was not found.`)

    const closedStatuses = new Set(['resolved', 'accepted', 'approved', 'declined'])
    const nextStatus = patch.status ?? existing.status
    const updated: TrackedItem = {
      ...existing,
      ...patch,
      id,
      updatedAt: nowTimestamp(),
      resolvedAt: closedStatuses.has(nextStatus)
        ? (existing.resolvedAt ?? nowTimestamp())
        : undefined,
    }
    let next: Workspace = {
      ...workspace,
      trackedItems: workspace.trackedItems.map((item) => (item.id === id ? updated : item)),
    }
    next = this.#logActivity(
      next,
      updated.goalId,
      'item_updated',
      `updated the ${updated.kind} “${updated.title}”`,
      actorId,
    )
    return this.#result(next, updated)
  }

  // --- Files -------------------------------------------------------------------------------------

  async createFileLink(input: NewFileLinkInput, actorId: ID): Promise<MutationResult<FileLink>> {
    const file: FileLink = { ...input, id: createId('fl'), addedAt: nowTimestamp() }
    let next: Workspace = { ...this.#read(), files: [...this.#read().files, file] }
    next = this.#logActivity(next, file.goalId, 'file_linked', `linked “${file.name}”`, actorId)
    return this.#result(next, file)
  }

  async deleteFileLink(id: ID, actorId: ID): Promise<Workspace> {
    const workspace = this.#read()
    const existing = workspace.files.find((file) => file.id === id)
    if (!existing) return clone(workspace)
    let next: Workspace = {
      ...workspace,
      files: workspace.files.filter((file) => file.id !== id),
    }
    next = this.#logActivity(
      next,
      existing.goalId,
      'file_linked',
      `removed the link “${existing.name}”`,
      actorId,
    )
    return this.#commit(next)
  }

  // --- Goal team -------------------------------------------------------------------------------------

  async addGoalMember(
    input: Omit<GoalMember, 'id'>,
    actorId: ID,
  ): Promise<MutationResult<GoalMember>> {
    const workspace = this.#read()
    const person = workspace.people.find((candidate) => candidate.id === input.personId)
    const member: GoalMember = { ...input, id: createId('gm') }
    let next: Workspace = { ...workspace, goalMembers: [...workspace.goalMembers, member] }
    next = this.#logActivity(
      next,
      member.goalId,
      'goal_updated',
      `added ${person?.name ?? 'someone'} to the goal team`,
      actorId,
    )
    return this.#result(next, member)
  }

  async updateGoalMember(
    id: ID,
    patch: Partial<GoalMember>,
    actorId: ID,
  ): Promise<MutationResult<GoalMember>> {
    const workspace = this.#read()
    const existing = workspace.goalMembers.find((member) => member.id === id)
    if (!existing) throw new Error(`Team member ${id} was not found.`)
    const updated: GoalMember = { ...existing, ...patch, id }
    let next: Workspace = {
      ...workspace,
      goalMembers: workspace.goalMembers.map((member) => (member.id === id ? updated : member)),
    }
    next = this.#logActivity(next, updated.goalId, 'goal_updated', 'updated a team role', actorId)
    return this.#result(next, updated)
  }

  async removeGoalMember(id: ID, actorId: ID): Promise<Workspace> {
    const workspace = this.#read()
    const existing = workspace.goalMembers.find((member) => member.id === id)
    if (!existing) return clone(workspace)
    const person = workspace.people.find((candidate) => candidate.id === existing.personId)
    let next: Workspace = {
      ...workspace,
      goalMembers: workspace.goalMembers.filter((member) => member.id !== id),
    }
    next = this.#logActivity(
      next,
      existing.goalId,
      'goal_updated',
      `removed ${person?.name ?? 'someone'} from the goal team`,
      actorId,
    )
    return this.#commit(next)
  }
}
