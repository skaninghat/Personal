import { useMemo, useState } from 'react'
import { PatientDetail } from './components/PatientDetail'
import { PatientTable } from './components/PatientTable'
import { StatCards } from './components/StatCards'
import { Uploader } from './components/Uploader'
import { evaluatePatients } from './lib/patientResult'
import type { FollowUpStatus, PatientRecord, RiskTier } from './lib/types'

export default function App() {
  const [records, setRecords] = useState<PatientRecord[] | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskTier | null>(null)
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpStatus | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const results = useMemo(() => (records ? evaluatePatients(records) : []), [records])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return results.filter((r) => {
      if (riskFilter && r.riskTier !== riskFilter) return false
      if (followUpFilter && r.followUp.status !== followUpFilter) return false
      if (query && !`${r.record.name} ${r.record.patientId}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [results, riskFilter, followUpFilter, search])

  const selected = results.find((r) => r.record.patientId === selectedId) ?? null

  if (!records) {
    return <Uploader onLoaded={(recs, name) => { setRecords(recs); setSourceName(name) }} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Patient Risk &amp; Follow-Up Dashboard</h1>
            <p className="text-sm text-slate-500">
              {results.length} patients loaded from {sourceName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setRecords(null); setSelectedId(null); setSearch(''); setRiskFilter(null); setFollowUpFilter(null) }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Upload new CSV
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        <StatCards
          results={results}
          onFilterRisk={(tier) => setRiskFilter((cur) => (cur === tier ? null : tier))}
          onFilterFollowUp={(status) => setFollowUpFilter((cur) => (cur === status ? null : status))}
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or patient ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />

          <select
            value={riskFilter ?? ''}
            onChange={(e) => setRiskFilter((e.target.value || null) as RiskTier | null)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All risk levels</option>
            <option value="high">High risk</option>
            <option value="medium">Medium risk</option>
            <option value="low">Low risk</option>
          </select>

          <select
            value={followUpFilter ?? ''}
            onChange={(e) => setFollowUpFilter((e.target.value || null) as FollowUpStatus | null)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All follow-up statuses</option>
            <option value="overdue">Overdue</option>
            <option value="due-soon">Due soon</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>

          {(riskFilter || followUpFilter || search) && (
            <button
              type="button"
              onClick={() => { setRiskFilter(null); setFollowUpFilter(null); setSearch('') }}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Clear filters
            </button>
          )}
        </div>

        <PatientTable results={filtered} selectedId={selectedId} onSelect={setSelectedId} />
      </main>

      {selected && (
        <>
          <div className="fixed inset-0 z-10 bg-slate-900/20" onClick={() => setSelectedId(null)} />
          <PatientDetail result={selected} onClose={() => setSelectedId(null)} />
        </>
      )}
    </div>
  )
}
