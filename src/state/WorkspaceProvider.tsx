import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { DEMO_PERSON_ID } from '@/data/seed'
import { dataService } from '@/services'
import { useToast } from '@/state/toast'
import {
  WorkspaceContext,
  emptyWorkspace,
  type LoadStatus,
  type WorkspaceContextValue,
} from '@/state/workspace'
import type { Session, Workspace } from '@/types'

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace)
  const [session, setSession] = useState<Session | undefined>()
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | undefined>()
  const { notify } = useToast()

  const load = useCallback(async () => {
    setStatus('loading')
    setError(undefined)
    try {
      const [loaded, storedSession] = await Promise.all([
        dataService.loadWorkspace(),
        dataService.getSession(),
      ])
      setWorkspace(loaded)
      setSession(storedSession)
      setStatus('ready')
    } catch (caught) {
      setError(messageFrom(caught))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** Every mutation funnels through here so errors surface the same way. */
  const run = useCallback(
    async <T,>(
      operation: () => Promise<{ workspace: Workspace; entity: T }>,
      successMessage?: string,
    ): Promise<T> => {
      try {
        const result = await operation()
        setWorkspace(result.workspace)
        if (successMessage) notify(successMessage, 'success')
        return result.entity
      } catch (caught) {
        notify(messageFrom(caught), 'error')
        throw caught
      }
    },
    [notify],
  )

  const runVoid = useCallback(
    async (operation: () => Promise<Workspace>, successMessage?: string): Promise<void> => {
      try {
        setWorkspace(await operation())
        if (successMessage) notify(successMessage, 'success')
      } catch (caught) {
        notify(messageFrom(caught), 'error')
        throw caught
      }
    },
    [notify],
  )

  const value = useMemo<WorkspaceContextValue>(() => {
    const currentUser = session
      ? workspace.people.find((person) => person.id === session.personId)
      : undefined
    const actor = session?.personId ?? DEMO_PERSON_ID

    return {
      status,
      error,
      workspace,
      session,
      currentUser,
      reload: load,

      resetDemoData: async () => {
        setStatus('loading')
        try {
          setWorkspace(await dataService.resetWorkspace())
          setStatus('ready')
          notify('Demo data restored.', 'success')
        } catch (caught) {
          setError(messageFrom(caught))
          setStatus('error')
        }
      },

      signIn: async (personId, mode) => {
        setSession(await dataService.signIn(personId, mode))
      },

      signOut: async () => {
        await dataService.signOut()
        setSession(undefined)
      },

      createGoal: (input) => run(() => dataService.createGoal(input, actor), 'Goal created.'),
      updateGoal: (id, patch) =>
        run(() => dataService.updateGoal(id, patch, actor), 'Goal updated.'),

      recordMetricReading: (input) =>
        run(
          () => dataService.recordMetricReading({ ...input, recordedById: actor }),
          'Measurement recorded.',
        ),

      createMilestone: (input) =>
        run(() => dataService.createMilestone(input, actor), 'Milestone added.'),
      updateMilestone: (id, patch) =>
        run(() => dataService.updateMilestone(id, patch, actor), 'Milestone updated.'),
      deleteMilestone: (id) =>
        runVoid(() => dataService.deleteMilestone(id, actor), 'Milestone removed.'),

      createTask: (input) => run(() => dataService.createTask(input, actor), 'Task added.'),
      updateTask: (id, patch) => run(() => dataService.updateTask(id, patch, actor), 'Task updated.'),
      deleteTask: (id) => runVoid(() => dataService.deleteTask(id, actor), 'Task removed.'),

      createMeeting: (input) => run(() => dataService.createMeeting(input, actor), 'Meeting saved.'),
      updateMeeting: (id, patch) =>
        run(() => dataService.updateMeeting(id, patch, actor), 'Meeting updated.'),
      deleteMeeting: (id) => runVoid(() => dataService.deleteMeeting(id, actor), 'Meeting removed.'),

      createDecision: (input) =>
        run(() => dataService.createDecision(input, actor), 'Decision recorded.'),
      deleteDecision: (id) =>
        runVoid(() => dataService.deleteDecision(id, actor), 'Decision removed.'),

      createTrackedItem: (input) =>
        run(() => dataService.createTrackedItem(input, actor), 'Item added.'),
      updateTrackedItem: (id, patch) =>
        run(() => dataService.updateTrackedItem(id, patch, actor), 'Item updated.'),

      createFileLink: (input) =>
        run(() => dataService.createFileLink({ ...input, addedById: actor }, actor), 'Link added.'),
      deleteFileLink: (id) => runVoid(() => dataService.deleteFileLink(id, actor), 'Link removed.'),

      addGoalMember: (input) =>
        run(() => dataService.addGoalMember(input, actor), 'Added to the goal team.'),
      updateGoalMember: (id, patch) =>
        run(() => dataService.updateGoalMember(id, patch, actor), 'Team updated.'),
      removeGoalMember: (id) =>
        runVoid(() => dataService.removeGoalMember(id, actor), 'Removed from the team.'),
    }
  }, [status, error, workspace, session, load, notify, run, runVoid])

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>
}
