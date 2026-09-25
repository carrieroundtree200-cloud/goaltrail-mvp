import { describe, expect, it } from 'vitest'

import { numericField } from './validation'

describe('numericField', () => {
  const field = numericField('Enter a number.')

  it('accepts a number', () => {
    expect(field.parse(42)).toBe(42)
  })

  it('accepts a numeric string and returns a number', () => {
    expect(field.parse('42.5')).toBe(42.5)
  })

  it('accepts zero typed deliberately', () => {
    expect(field.parse('0')).toBe(0)
  })

  it('accepts negative numbers', () => {
    expect(field.parse('-3')).toBe(-3)
  })

  it('rejects an empty field instead of reading it as zero', () => {
    const result = field.safeParse('')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Enter a number.')
  })

  it('rejects whitespace', () => {
    expect(field.safeParse('   ').success).toBe(false)
  })

  it('rejects text that is not a number', () => {
    const result = field.safeParse('soon')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Enter a number.')
  })
})
