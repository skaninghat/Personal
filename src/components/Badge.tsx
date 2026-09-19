import type { FollowUpStatus, RiskTier } from '../lib/types'

const RISK_STYLES: Record<RiskTier, string> = {
  high: 'bg-red-100 text-red-800 ring-red-600/20',
  medium: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  low: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
}

const RISK_LABELS: Record<RiskTier, string> = {
  high: 'High risk',
  medium: 'Medium risk',
  low: 'Low risk',
}

export function RiskBadge({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${RISK_STYLES[tier]}`}
    >
      {RISK_LABELS[tier]}
    </span>
  )
}

const FOLLOW_UP_STYLES: Record<FollowUpStatus, string> = {
  overdue: 'bg-red-100 text-red-800 ring-red-600/20',
  'due-soon': 'bg-amber-100 text-amber-800 ring-amber-600/20',
  scheduled: 'bg-slate-100 text-slate-700 ring-slate-500/20',
}

const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  overdue: 'Overdue',
  'due-soon': 'Due soon',
  scheduled: 'Scheduled',
}

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${FOLLOW_UP_STYLES[status]}`}
    >
      {FOLLOW_UP_LABELS[status]}
    </span>
  )
}
