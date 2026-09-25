import { beforeEach, describe, expect, it } from 'vitest'

import { LocalDataService } from './localDataService'
import { removeKey } from './storage'

const ACTOR = 'p_daniel'

function service() {
  return new LocalDataService()
}

async function firstGoalId(api: LocalDataService) {
  const workspace = await api.loadWorkspace()
  return workspace.goals[0]!.id
}

beforeEach(() => {
  removeKey('goaltrail.workspace.v1')
  removeKey('goaltrail.session.v1')
})

describe('LocalDataService', () => {
  it('seeds the demo workspace on first load', async () => {
    const workspace = await service().loadWorkspace()
    expect(workspace.goals.length).toBeGreaterThan(0)
    expect(workspace.people.length).toBeGreaterThan(0)
  })

  it('persists a change so a fresh instance reads it back', async () => {
    const api = service()
    const goalId = await firstGoalId(api)
    const { entity } = await api.createTask(
      {
        goalId,
        title: 'Publish the carrier scorecard',
        ownerId: ACTOR,
        status: 'todo',
        priority: 'high',
      },
      ACTOR,
    )

    const reloaded = await service().loadWorkspace()
    expect(reloaded.tasks.find((task) => task.id === entity.id)?.title).toBe(
      'Publish the carrier scorecard',
    )
  })

  it('records who did what in the activity feed', async () => {
    const api = service()
    const goalId = await firstGoalId(api)
    const before = (await api.loadWorkspace()).activity.length
    const { workspace } = await api.createTask(
      { goalId, title: 'Chase the depot report', ownerId: ACTOR, status: 'todo', priority: 'low' },
      ACTOR,
    )
    expect(workspace.activity.length).toBe(before + 1)
    expect(workspace.activity[0]?.summary).toContain('Chase the depot report')
    expect(workspace.activity[0]?.actorId).toBe(ACTOR)
  })

  it('drops the blocked reason once a task is unblocked', async () => {
    const api = service()
    const goalId = await firstGoalId(api)
    const { entity: task } = await api.createTask(
      {
        goalId,
        title: 'Switch the northern depot to the new route plan',
        ownerId: ACTOR,
        status: 'blocked',
        priority: 'high',
        blockedReason: 'Waiting on the depot manager to confirm dock hours.',
      },
      ACTOR,
    )
    expect(task.blockedReason).toBeTruthy()

    const { entity: unblocked } = await api.updateTask(task.id, { status: 'in_progress' }, ACTOR)
    expect(unblocked.blockedReason).toBeUndefined()
  })

  it('stamps a completion time on done and clears it when work reopens', async () => {
    const api = service()
    const goalId = await firstGoalId(api)
    const { entity: task } = await api.createTask(
      { goalId, title: 'Send the weekly metric email', ownerId: ACTOR, status: 'todo', priority: 'medium' },
      ACTOR,
    )
    expect(task.completedAt).toBeUndefined()

    const { entity: done } = await api.updateTask(task.id, { status: 'done' }, ACTOR)
    expect(done.completedAt).toBeTruthy()

    const { entity: reopened } = await api.updateTask(task.id, { status: 'todo' }, ACTOR)
    expect(reopened.completedAt).toBeUndefined()
  })

  it('stamps a resolution time only while a tracked item is closed', async () => {
    const api = service()
    const goalId = await firstGoalId(api)
    const { entity: item } = await api.createTrackedItem(
      {
        goalId,
        kind: 'risk',
        title: 'Peak season could outrun the new depot capacity',
        detail: 'Volumes in November are forecast 18% above the plan the depot was sized for.',
        impact: 'high',
        status: 'open',
        ownerId: ACTOR,
      },
      ACTOR,
    )
    expect(item.resolvedAt).toBeUndefined()

    const { entity: closed } = await api.updateTrackedItem(item.id, { status: 'resolved' }, ACTOR)
    expect(closed.resolvedAt).toBeTruthy()

    const { entity: reopened } = await api.updateTrackedItem(item.id, { status: 'open' }, ACTOR)
    expect(reopened.resolvedAt).toBeUndefined()
  })

  it('keeps tasks when their milestone is deleted', async () => {
    const api = service()
    const workspace = await api.loadWorkspace()
    const milestone = workspace.milestones.find((candidate) =>
      workspace.tasks.some((task) => task.milestoneId === candidate.id),
    )!
    const affected = workspace.tasks.filter((task) => task.milestoneId === milestone.id)
    expect(affected.length).toBeGreaterThan(0)

    const next = await api.deleteMilestone(milestone.id, ACTOR)
    expect(next.milestones.some((item) => item.id === milestone.id)).toBe(false)
    for (const task of affected) {
      const survivor = next.tasks.find((candidate) => candidate.id === task.id)
      expect(survivor).toBeDefined()
      expect(survivor?.milestoneId).toBeUndefined()
    }
  })

  it('creates a goal with its owner, milestones and baseline measurement', async () => {
    const api = service()
    const { workspace, entity: goal } = await api.createGoal(
      {
        title: 'Cut damaged-pallet claims to 1.5%',
        purpose: 'Damaged pallets cost us margin and trust with our three largest retail accounts.',
        beneficiary: 'Retail account managers and the claims team',
        ownerId: ACTOR,
        deadline: '2026-12-31',
        startDate: '2026-01-05',
        tags: ['quality'],
        metric: {
          name: 'Damaged pallet rate',
          unit: 'percent',
          direction: 'decrease',
          baseline: 3.4,
          target: 1.5,
          source: 'Claims register, weekly export',
          cadence: 'weekly',
        },
        initialReading: { date: '2026-01-05', value: 3.4 },
        milestones: [
          {
            title: 'Re-train the loading crews',
            detail: 'Every depot runs the new stacking module and signs off attendance.',
            dueDate: '2026-03-31',
            ownerId: ACTOR,
          },
        ],
      },
      ACTOR,
    )

    expect(workspace.goals.some((item) => item.id === goal.id)).toBe(true)
    expect(goal.status).toBe('active')

    const owner = workspace.goalMembers.find(
      (member) => member.goalId === goal.id && member.role === 'owner',
    )
    expect(owner?.personId).toBe(ACTOR)

    expect(workspace.milestones.filter((item) => item.goalId === goal.id)).toHaveLength(1)
    expect(workspace.metricReadings.filter((item) => item.goalId === goal.id)).toEqual([
      expect.objectContaining({ value: 3.4, recordedById: ACTOR }),
    ])
  })

  it('resets back to the demo data', async () => {
    const api = service()
    const goalId = await firstGoalId(api)
    await api.createTask(
      { goalId, title: 'Temporary task', ownerId: ACTOR, status: 'todo', priority: 'low' },
      ACTOR,
    )
    const reset = await api.resetWorkspace()
    expect(reset.tasks.some((task) => task.title === 'Temporary task')).toBe(false)
  })

  it('signs a person in and out', async () => {
    const api = service()
    expect(await api.getSession()).toBeUndefined()
    const session = await api.signIn(ACTOR, 'demo')
    expect(session.personId).toBe(ACTOR)
    expect(await api.getSession()).toMatchObject({ personId: ACTOR, mode: 'demo' })
    await api.signOut()
    expect(await api.getSession()).toBeUndefined()
  })
})
