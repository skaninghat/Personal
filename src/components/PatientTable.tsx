import { useMemo, useState } from 'react'
import type { PatientResult } from '../lib/types'
import { FollowUpBadge, RiskBadge } from './Badge'

type SortKey = 'name' | 'lace' | 'followup'

const RISK_ORDER = { high: 0, medium: 1, low: 2 } as const
const FOLLOW_UP_ORDER = { overdue: 0, 'due-soon': 1, scheduled: 2 } as const

interface PatientTableProps {
  results: PatientResult[]
  selectedId: string | null
  onSelect: (patientId: string) => void
}

export function PatientTable({ results, selectedId, onSelect }: PatientTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('lace')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1) as 1 | -1)
    } else {
      setSortKey(key)
      setSortDir(-1)
    }
  }

  const sorted = useMemo(() => {
    const copy = [...results]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.patient.name.localeCompare(b.patient.name)
      } else if (sortKey === 'lace') {
        cmp = a.lace.total - b.lace.total || RISK_ORDER[a.riskTier] - RISK_ORDER[b.riskTier]
      } else {
        cmp = FOLLOW_UP_ORDER[a.followUp.status] - FOLLOW_UP_ORDER[b.followUp.status]
      }
      return cmp * sortDir
    })
    return copy
  }, [results, sortKey, sortDir])

  function sortIndicator(key: SortKey) {
    if (key !== sortKey) return null
    return <span className="ml-1 text-slate-400">{sortDir === 1 ? '↑' : '↓'}</span>
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No patients match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th
              className="cursor-pointer select-none px-4 py-3 text-left font-medium text-slate-600"
              onClick={() => toggleSort('name')}
            >
              Patient{sortIndicator('name')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Age / Sex</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">HF profile</th>
            <th
              className="cursor-pointer select-none px-4 py-3 text-left font-medium text-slate-600"
              onClick={() => toggleSort('lace')}
            >
              LACE score{sortIndicator('lace')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Risk</th>
            <th
              className="cursor-pointer select-none px-4 py-3 text-left font-medium text-slate-600"
              onClick={() => toggleSort('followup')}
            >
              Follow-up{sortIndicator('followup')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((r) => (
            <tr
              key={r.patient.patientId}
              onClick={() => onSelect(r.patient.patientId)}
              className={`cursor-pointer hover:bg-slate-50 ${
                selectedId === r.patient.patientId ? 'bg-blue-50' : ''
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{r.patient.name}</div>
                <div className="text-xs text-slate-500">{r.patient.patientId}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {r.patient.age ?? '—'} {r.patient.sex ?? ''}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {r.clinicalSnapshot.hfType ?? '—'}
                {r.clinicalSnapshot.nyhaClass && (
                  <span className="text-slate-400"> · NYHA {r.clinicalSnapshot.nyhaClass}</span>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{r.lace.total}</td>
              <td className="px-4 py-3">
                <RiskBadge tier={r.riskTier} />
              </td>
              <td className="px-4 py-3">
                <FollowUpBadge status={r.followUp.status} />
              </td>
              <td className="px-4 py-3 text-slate-600">{r.followUp.dueDate ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
