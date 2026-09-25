import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDot,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  FileType,
  Gauge,
  GitPullRequestArrow,
  Link2,
  Minus,
  Presentation,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import type { BadgeTone } from '@/components/ui/Badge'
import type { HealthLevel } from '@/lib/health'
import type { TargetStatus } from '@/lib/metrics'
import type {
  FileKind,
  GoalRole,
  ItemImpact,
  MilestoneStatus,
  TaskPriority,
  TaskStatus,
  TrackedItemKind,
  TrackedItemStatus,
} from '@/types'

export interface StatusMeta {
  label: string
  icon: LucideIcon
  tone: BadgeTone
}

export const healthMeta: Record<HealthLevel, StatusMeta> = {
  on_track: { label: 'On track', icon: CheckCircle2, tone: 'positive' },
  watch: { label: 'Watch', icon: Eye, tone: 'caution' },
  at_risk: { label: 'At risk', icon: AlertTriangle, tone: 'warning' },
  blocked: { label: 'Blocked', icon: Ban, tone: 'critical' },
}

export const targetMeta: Record<TargetStatus, StatusMeta> = {
  met: { label: 'Target met', icon: CheckCircle2, tone: 'positive' },
  ahead: { label: 'Ahead of pace', icon: TrendingUp, tone: 'positive' },
  on_pace: { label: 'On pace', icon: Gauge, tone: 'accent' },
  behind: { label: 'Behind pace', icon: TrendingDown, tone: 'caution' },
  missed: { label: 'Target missed', icon: AlertTriangle, tone: 'critical' },
  not_started: { label: 'No readings yet', icon: Minus, tone: 'neutral' },
}

export const taskStatusMeta: Record<TaskStatus, StatusMeta> = {
  backlog: { label: 'Backlog', icon: CircleDashed, tone: 'neutral' },
  todo: { label: 'To do', icon: Circle, tone: 'neutral' },
  in_progress: { label: 'In progress', icon: CircleDot, tone: 'accent' },
  blocked: { label: 'Blocked', icon: Ban, tone: 'critical' },
  done: { label: 'Done', icon: CheckCircle2, tone: 'positive' },
}

/** Left-to-right order of the work board columns. */
export const taskStatusOrder: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'blocked', 'done']

export const priorityMeta: Record<TaskPriority, StatusMeta> = {
  low: { label: 'Low', icon: Minus, tone: 'neutral' },
  medium: { label: 'Medium', icon: CircleDot, tone: 'neutral' },
  high: { label: 'High', icon: TrendingUp, tone: 'caution' },
  critical: { label: 'Critical', icon: AlertTriangle, tone: 'critical' },
}

export const milestoneStatusMeta: Record<MilestoneStatus, StatusMeta> = {
  not_started: { label: 'Not started', icon: CircleDashed, tone: 'neutral' },
  in_progress: { label: 'In progress', icon: CircleDot, tone: 'accent' },
  at_risk: { label: 'At risk', icon: AlertTriangle, tone: 'warning' },
  done: { label: 'Done', icon: CheckCircle2, tone: 'positive' },
}

export const itemKindMeta: Record<TrackedItemKind, StatusMeta & { plural: string }> = {
  risk: { label: 'Risk', plural: 'Risks', icon: ShieldAlert, tone: 'caution' },
  blocker: { label: 'Blocker', plural: 'Blockers', icon: Ban, tone: 'critical' },
  change: { label: 'Change', plural: 'Changes', icon: GitPullRequestArrow, tone: 'accent' },
}

export const impactMeta: Record<ItemImpact, StatusMeta> = {
  low: { label: 'Low impact', icon: Minus, tone: 'neutral' },
  medium: { label: 'Medium impact', icon: CircleDot, tone: 'neutral' },
  high: { label: 'High impact', icon: TrendingUp, tone: 'warning' },
  critical: { label: 'Critical impact', icon: AlertTriangle, tone: 'critical' },
}

export const itemStatusMeta: Record<TrackedItemStatus, StatusMeta> = {
  open: { label: 'Open', icon: Circle, tone: 'warning' },
  monitoring: { label: 'Monitoring', icon: Eye, tone: 'caution' },
  mitigating: { label: 'Working on it', icon: Clock, tone: 'accent' },
  resolved: { label: 'Resolved', icon: CheckCircle2, tone: 'positive' },
  accepted: { label: 'Accepted', icon: CheckCircle2, tone: 'neutral' },
  approved: { label: 'Approved', icon: CheckCircle2, tone: 'positive' },
  declined: { label: 'Declined', icon: Ban, tone: 'neutral' },
}

/** Which statuses make sense for each kind of tracked item. */
export const itemStatusesByKind: Record<TrackedItemKind, TrackedItemStatus[]> = {
  risk: ['open', 'monitoring', 'mitigating', 'accepted', 'resolved'],
  blocker: ['open', 'mitigating', 'resolved'],
  change: ['open', 'approved', 'declined'],
}

export const roleMeta: Record<GoalRole, { label: string; description: string }> = {
  owner: { label: 'Owner', description: 'Accountable for the goal reaching its target' },
  sponsor: { label: 'Sponsor', description: 'Clears obstacles and makes the final call' },
  contributor: { label: 'Contributor', description: 'Does the work on the plan' },
  reviewer: { label: 'Reviewer', description: 'Checks the work before it ships' },
}

export const fileKindMeta: Record<FileKind, StatusMeta> = {
  doc: { label: 'Document', icon: FileText, tone: 'neutral' },
  sheet: { label: 'Spreadsheet', icon: FileSpreadsheet, tone: 'neutral' },
  slides: { label: 'Slides', icon: Presentation, tone: 'neutral' },
  pdf: { label: 'PDF', icon: FileType, tone: 'neutral' },
  dashboard: { label: 'Dashboard', icon: Gauge, tone: 'neutral' },
  link: { label: 'Link', icon: Link2, tone: 'neutral' },
}
