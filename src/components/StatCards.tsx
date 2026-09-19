import type { PatientResult } from '../lib/types'

interface StatCardsProps {
  results: PatientResult[]
  onFilterRisk: (tier: 'high' | 'medium' | 'low' | null) => void
  onFilterFollowUp: (status: 'overdue' | 'due-soon' | null) => void
}

function Card({
  label,
  value,
  accent,
  onClick,
}: {
  label: string
  value: number
  accent: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <span className={`text-2xl font-semibold ${accent}`}>{value}</span>
      <span className="mt-1 text-sm text-slate-500">{label}</span>
    </button>
  )
}

export function StatCards({ results, onFilterRisk, onFilterFollowUp }: StatCardsProps) {
  const high = results.filter((r) => r.riskTier === 'high').length
  const medium = results.filter((r) => r.riskTier === 'medium').length
  const low = results.filter((r) => r.riskTier === 'low').length
  const overdue = results.filter((r) => r.followUp.status === 'overdue').length
  const dueSoon = results.filter((r) => r.followUp.status === 'due-soon').length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card label="High risk" value={high} accent="text-red-700" onClick={() => onFilterRisk('high')} />
      <Card label="Medium risk" value={medium} accent="text-amber-700" onClick={() => onFilterRisk('medium')} />
      <Card label="Low risk" value={low} accent="text-emerald-700" onClick={() => onFilterRisk('low')} />
      <Card
        label="Follow-ups overdue"
        value={overdue}
        accent="text-red-700"
        onClick={() => onFilterFollowUp('overdue')}
      />
      <Card
        label="Follow-ups due soon"
        value={dueSoon}
        accent="text-amber-700"
        onClick={() => onFilterFollowUp('due-soon')}
      />
    </div>
  )
}
