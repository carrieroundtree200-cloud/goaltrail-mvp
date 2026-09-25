import type {
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

/**
 * The single boundary between the UI and wherever data happens to live.
 *
 * Today the only implementation is `LocalDataService`, backed by localStorage.
 * A `SupabaseDataService` can be dropped in behind this interface without the
 * rest of the app changing: every method is async, every mutation returns the
 * resulting workspace so the caller never has to guess what the store now holds,
 * and nothing above this layer imports `localStorage` or the seed data.
 */

export type NewGoalInput = Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: Goal['status']
  /** Optional first reading, recorded at creation time. */
  initialReading?: { date: string; value: number; note?: string }
  /** Milestones sketched out in the goal wizard. */
  milestones?: Pick<Milestone, 'title' | 'detail' | 'dueDate' | 'ownerId'>[]
  /** People added to the goal team in the goal wizard. */
  members?: Pick<GoalMember, 'personId' | 'role' | 'responsibility'>[]
}

export type NewTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
export type NewMeetingInput = Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>
export type NewTrackedItemInput = Omit<TrackedItem, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'>
export type NewDecisionInput = Omit<Decision, 'id'>
export type NewMetricReadingInput = Omit<MetricReading, 'id'>
export type NewFileLinkInput = Omit<FileLink, 'id' | 'addedAt'>

/** Every mutation hands back the full workspace plus the row it touched. */
export interface MutationResult<T> {
  workspace: Workspace
  entity: T
}

export interface DataService {
  loadWorkspace(): Promise<Workspace>
  /** Throw away local edits and restore the Northstar Logistics demo data. */
  resetWorkspace(): Promise<Workspace>

  getSession(): Promise<Session | undefined>
  signIn(personId: ID, mode: Session['mode']): Promise<Session>
  signOut(): Promise<void>

  createGoal(input: NewGoalInput, actorId: ID): Promise<MutationResult<Goal>>
  updateGoal(id: ID, patch: Partial<Goal>, actorId: ID): Promise<MutationResult<Goal>>

  recordMetricReading(input: NewMetricReadingInput): Promise<MutationResult<MetricReading>>

  createMilestone(
    input: Omit<Milestone, 'id' | 'order'> & { order?: number },
    actorId: ID,
  ): Promise<MutationResult<Milestone>>
  updateMilestone(
    id: ID,
    patch: Partial<Milestone>,
    actorId: ID,
  ): Promise<MutationResult<Milestone>>
  deleteMilestone(id: ID, actorId: ID): Promise<Workspace>

  createTask(input: NewTaskInput, actorId: ID): Promise<MutationResult<Task>>
  updateTask(id: ID, patch: Partial<Task>, actorId: ID): Promise<MutationResult<Task>>
  deleteTask(id: ID, actorId: ID): Promise<Workspace>

  createMeeting(input: NewMeetingInput, actorId: ID): Promise<MutationResult<Meeting>>
  updateMeeting(id: ID, patch: Partial<Meeting>, actorId: ID): Promise<MutationResult<Meeting>>
  deleteMeeting(id: ID, actorId: ID): Promise<Workspace>

  createDecision(input: NewDecisionInput, actorId: ID): Promise<MutationResult<Decision>>
  deleteDecision(id: ID, actorId: ID): Promise<Workspace>

  createTrackedItem(input: NewTrackedItemInput, actorId: ID): Promise<MutationResult<TrackedItem>>
  updateTrackedItem(
    id: ID,
    patch: Partial<TrackedItem>,
    actorId: ID,
  ): Promise<MutationResult<TrackedItem>>

  createFileLink(input: NewFileLinkInput, actorId: ID): Promise<MutationResult<FileLink>>
  deleteFileLink(id: ID, actorId: ID): Promise<Workspace>

  addGoalMember(
    input: Omit<GoalMember, 'id'>,
    actorId: ID,
  ): Promise<MutationResult<GoalMember>>
  updateGoalMember(
    id: ID,
    patch: Partial<GoalMember>,
    actorId: ID,
  ): Promise<MutationResult<GoalMember>>
  removeGoalMember(id: ID, actorId: ID): Promise<Workspace>
}
