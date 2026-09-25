import { formatShortDate } from '@/lib/dates'
import { formatMetricValue } from '@/lib/format'
import type { MetricSnapshot } from '@/lib/metrics'
import type { Goal } from '@/types'

const WIDTH = 640
const HEIGHT = 190
const PADDING = { top: 16, right: 16, bottom: 26, left: 16 }

/**
 * A small line chart with the baseline and target drawn in, plus a hidden table
 * carrying the same numbers for screen readers.
 */
export function MetricHistory({ goal, metric }: { goal: Goal; metric: MetricSnapshot }) {
  const points = metric.history
  const unit = goal.metric.unit

  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Record at least two measurements to see how the metric is moving.
      </p>
    )
  }

  const values = [...points.map((point) => point.value), metric.target, metric.baseline]
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.15
  const min = rawMin - pad
  const max = rawMax + pad

  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  const x = (index: number) => PADDING.left + (index / (points.length - 1)) * plotWidth
  const y = (value: number) => PADDING.top + (1 - (value - min) / (max - min)) * plotHeight

  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')
  const area = `${PADDING.left},${PADDING.top + plotHeight} ${line} ${PADDING.left + plotWidth},${PADDING.top + plotHeight}`

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-48 w-full"
        role="img"
        aria-label={`${goal.metric.name} from ${formatMetricValue(metric.baseline, unit)} at the start to ${formatMetricValue(metric.current, unit)} today, against a target of ${formatMetricValue(metric.target, unit)}.`}
      >
        <defs>
          <linearGradient id="metric-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={PADDING.left}
          x2={PADDING.left + plotWidth}
          y1={y(metric.target)}
          y2={y(metric.target)}
          stroke="var(--color-emerald-500)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <text
          x={PADDING.left + plotWidth}
          y={y(metric.target) - 6}
          textAnchor="end"
          className="fill-emerald-700 text-[11px] font-medium"
        >
          Target {formatMetricValue(metric.target, unit)}
        </text>

        <line
          x1={PADDING.left}
          x2={PADDING.left + plotWidth}
          y1={y(metric.baseline)}
          y2={y(metric.baseline)}
          stroke="var(--color-slate-300)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
        <text
          x={PADDING.left}
          y={y(metric.baseline) + 14}
          className="fill-slate-500 text-[11px]"
        >
          Baseline {formatMetricValue(metric.baseline, unit)}
        </text>

        <polygon points={area} fill="url(#metric-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent-600)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={x(index)}
            cy={y(point.value)}
            r={index === points.length - 1 ? 4.5 : 2.5}
            fill="white"
            stroke="var(--color-accent-700)"
            strokeWidth="2"
          >
            <title>{`${formatShortDate(point.date)}: ${formatMetricValue(point.value, unit)}`}</title>
          </circle>
        ))}

        <text x={PADDING.left} y={HEIGHT - 6} className="fill-slate-500 text-[11px]">
          {formatShortDate(points[0]!.date)}
        </text>
        <text
          x={PADDING.left + plotWidth}
          y={HEIGHT - 6}
          textAnchor="end"
          className="fill-slate-500 text-[11px]"
        >
          {formatShortDate(points[points.length - 1]!.date)}
        </text>
      </svg>

      <table className="sr-only">
        <caption>{goal.metric.name} readings</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr key={`${point.date}-row-${index}`}>
              <td>{formatShortDate(point.date)}</td>
              <td>{formatMetricValue(point.value, unit)}</td>
              <td>{point.note ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
