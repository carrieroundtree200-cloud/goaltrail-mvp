import { describe, expect, it } from 'vitest'

import { describeDueDate, describeSchedule, shiftDays } from './dates'

const inDays = (days: number) => shiftDays(days)

describe('describeDueDate', () => {
  it('reads naturally either side of today', () => {
    expect(describeDueDate(inDays(0))).toBe('Due today')
    expect(describeDueDate(inDays(1))).toBe('Due tomorrow')
    expect(describeDueDate(inDays(9))).toBe('Due in 9 days')
    expect(describeDueDate(inDays(-1))).toBe('1 day overdue')
    expect(describeDueDate(inDays(-6))).toBe('6 days overdue')
  })
})

describe('describeSchedule', () => {
  it('never calls finished work overdue', () => {
    expect(describeSchedule(inDays(-40), true)).not.toContain('overdue')
    expect(describeSchedule(inDays(-40), true)).toMatch(/^Was due /)
  })

  it('still flags unfinished work that has slipped', () => {
    expect(describeSchedule(inDays(-40), false)).toBe('40 days overdue')
  })

  it('handles work with no date at all', () => {
    expect(describeSchedule(undefined, false)).toBe('No due date')
    expect(describeSchedule(undefined, true)).toBe('No due date was set')
  })
})
