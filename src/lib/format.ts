import type { MetricUnit } from '@/types'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function trimNumber(value: number, maxDecimals: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDecimals }).format(value)
}

/** Render a metric value the way a person would write it. */
export function formatMetricValue(value: number, unit: MetricUnit): string {
  switch (unit) {
    case 'percent':
      return `${trimNumber(value, 1)}%`
    case 'currency':
      return Math.abs(value) >= 100_000 ? compactCurrency.format(value) : currency.format(value)
    case 'days':
      return `${trimNumber(value, 1)} ${Math.abs(value) === 1 ? 'day' : 'days'}`
    case 'hours':
      return `${trimNumber(value, 1)} ${Math.abs(value) === 1 ? 'hour' : 'hours'}`
    case 'rating':
      return trimNumber(value, 1)
    case 'count':
    default:
      return trimNumber(value, value % 1 === 0 ? 0 : 1)
  }
}

/** A signed change, e.g. "+4.8 points" or "−$0.43". */
export function formatMetricDelta(delta: number, unit: MetricUnit): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  const magnitude = Math.abs(delta)
  if (unit === 'percent') return `${sign}${trimNumber(magnitude, 1)} points`
  if (unit === 'currency') return `${sign}${currency.format(magnitude)}`
  return `${sign}${formatMetricValue(magnitude, unit)}`
}

export function formatPercent(fraction: number, decimals = 0): string {
  return `${trimNumber(fraction * 100, decimals)}%`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}
