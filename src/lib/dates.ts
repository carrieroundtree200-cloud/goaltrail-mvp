import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'

import type { DateOnly, Timestamp } from '@/types'

/** Today at 00:00 local time. One helper so every calculation agrees. */
export function today(): Date {
  return startOfDay(new Date())
}

export function toDate(value: DateOnly | Timestamp): Date {
  return parseISO(value)
}

export function toDateOnly(value: Date): DateOnly {
  return format(value, 'yyyy-MM-dd')
}

export function nowTimestamp(): Timestamp {
  return new Date().toISOString()
}

export function shiftDays(days: number, from: Date = today()): DateOnly {
  return toDateOnly(addDays(from, days))
}

export function shiftDaysTimestamp(days: number, hour = 9, minute = 0): Timestamp {
  const base = addDays(today(), days)
  base.setHours(hour, minute, 0, 0)
  return base.toISOString()
}

/** Whole days from today until `date`. Negative means the date has passed. */
export function daysUntil(date: DateOnly): number {
  return differenceInCalendarDays(startOfDay(toDate(date)), today())
}

export function isOverdue(date: DateOnly | undefined): boolean {
  if (!date) return false
  return daysUntil(date) < 0
}

export function formatDate(value: DateOnly | Timestamp | undefined, pattern = 'd MMM yyyy'): string {
  if (!value) return '—'
  const parsed = toDate(value)
  return isValid(parsed) ? format(parsed, pattern) : '—'
}

export function formatShortDate(value: DateOnly | Timestamp | undefined): string {
  return formatDate(value, 'd MMM')
}

export function formatDateTime(value: Timestamp | undefined): string {
  return formatDate(value, "d MMM yyyy 'at' HH:mm")
}

export function formatRelative(value: Timestamp | DateOnly | undefined): string {
  if (!value) return '—'
  const parsed = toDate(value)
  if (!isValid(parsed)) return '—'
  return `${formatDistanceToNowStrict(parsed)} ago`
}

/** "in 12 days", "today", "3 days overdue" — readable without doing the maths. */
export function describeDueDate(date: DateOnly | undefined): string {
  if (!date) return 'No due date'
  const days = daysUntil(date)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days === -1) return '1 day overdue'
  if (days < 0) return `${Math.abs(days)} days overdue`
  return `Due in ${days} days`
}

export function describeDeadline(date: DateOnly): string {
  const days = daysUntil(date)
  if (days === 0) return 'Deadline is today'
  if (days < 0) return `Deadline passed ${Math.abs(days)} days ago`
  return `${days} days remaining`
}

/** Portion of the goal window that has elapsed, clamped to 0–1. */
export function elapsedFraction(startDate: DateOnly, deadline: DateOnly): number {
  const start = startOfDay(toDate(startDate)).getTime()
  const end = startOfDay(toDate(deadline)).getTime()
  const now = today().getTime()
  if (end <= start) return 1
  return clamp01((now - start) / (end - start))
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}
