import { createContext, useContext } from 'react'

import type {
  Decision,
  FileLink,
  Goal,
  GoalMember,
  ID,
  Meeting,
  MetricReading,
  Milestone,
  Person,
  Session,
  Task,
  TrackedItem,
  Workspace,
} from '@/types'
import type {
  NewDecisionInput,
  NewFileLinkInput,
  NewGoalInput,
  NewMeetingInput,
  NewMetricReadingInput,
  NewTaskInput,
  NewTrackedItemInput,
} from '@/services'

export type LoadStatus = 'loading' | 'ready' | 'error'

export const emptyWorkspace: Workspace = {
  people: [],
  goals: [],
  goalMembers: [],
  metricReadings: [],
  milestones: [],
  tasks: [],
  meetings: [],
  decisions: [],
  trackedItems: [],
  files: [],
  activity: [],
}

export interface WorkspaceActions {
  createGoal: (input: NewGoalInput) => Promise<Goal>
  updateGoal: (id: ID, patch: Partial<Goal>) => Promise<Goal>
  recordMetricReading: (input: Omit<NewMetricReadingInput, 'recordedById'>) => Promise<MetricReading>
  createMilestone: (
    input: Omit<Milestone, 'id' | 'order'> & { order?: number },
  ) => Promise<Milestone>
  updateMilestone: (id: ID, patch: Partial<Milestone>) => Promise<Milestone>
  deleteMilestone: (id: ID) => Promise<void>
  createTask: (input: NewTaskInput) => Promise<Task>
  updateTask: (id: ID, patch: Partial<Task>) => Promise<Task>
  deleteTask: (id: ID) => Promise<void>
  createMeeting: (input: NewMeetingInput) => Promise<Meeting>
  updateMeeting: (id: ID, patch: Partial<Meeting>) => Promise<Meeting>
  deleteMeeting: (id: ID) => Promise<void>
  createDecision: (input: NewDecisionInput) => Promise<Decision>
  deleteDecision: (id: ID) => Promise<void>
  createTrackedItem: (input: NewTrackedItemInput) => Promise<TrackedItem>
  updateTrackedItem: (id: ID, patch: Partial<TrackedItem>) => Promise<TrackedItem>
  createFileLink: (input: Omit<NewFileLinkInput, 'addedById'>) => Promise<FileLink>
  deleteFileLink: (id: ID) => Promise<void>
  addGoalMember: (input: Omit<GoalMember, 'id'>) => Promise<GoalMember>
  updateGoalMember: (id: ID, patch: Partial<GoalMember>) => Promise<GoalMember>
  removeGoalMember: (id: ID) => Promise<void>
}

export interface WorkspaceContextValue extends WorkspaceActions {
  status: LoadStatus
  error?: string
  workspace: Workspace
  session?: Session
  currentUser?: Person
  reload: () => Promise<void>
  resetDemoData: () => Promise<void>
  signIn: (personId: ID, mode: Session['mode']) => Promise<void>
  signOut: () => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside <WorkspaceProvider>.')
  return context
}
