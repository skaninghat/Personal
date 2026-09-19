import type { PatientResult } from '../lib/types'
import { FollowUpBadge, RiskBadge } from './Badge'

interface PatientDetailProps {
  result: PatientResult | null
  onClose: () => void
}

function ScoreRow({ label, points, detail }: { label: string; points: number; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{detail}</div>
      </div>
      <div className="text-sm font-semibold text-slate-900">{points} pts</div>
    </div>
  )
}

export function PatientDetail({ result, onClose }: PatientDetailProps) {
  if (!result) return null
  const { record, lace, riskTier, followUp } = result

  return (
    <aside className="fixed inset-y-0 right-0 z-20 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{record.name}</h2>
          <p className="text-sm text-slate-500">
            {record.patientId} · {record.age ?? '—'} y/o {record.sex ?? ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <RiskBadge tier={riskTier} />
        <FollowUpBadge status={followUp.status} />
      </div>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">LACE Index — {lace.total} / 19</h3>
        <div className="mt-2 rounded-lg border border-slate-200 p-3">
          <ScoreRow
            label="L — Length of stay"
            points={lace.lengthOfStayPoints}
            detail={`${record.lengthOfStayDays ?? '—'} day(s)`}
          />
          <ScoreRow
            label="A — Acuity of admission"
            points={lace.acuityPoints}
            detail={record.admissionType ?? 'unknown'}
          />
          <ScoreRow
            label="C — Comorbidity (Charlson)"
            points={lace.comorbidityPoints}
            detail={
              record.comorbidities.length > 0
                ? record.comorbidities.join(', ')
                : `Charlson score: ${lace.charlsonScore}`
            }
          />
          <ScoreRow
            label="E — ED visits (6 mo)"
            points={lace.edVisitPoints}
            detail={`${record.edVisits6mo ?? 0} visit(s)`}
          />
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">Follow-up</h3>
        <div className="mt-2 space-y-1 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
          {followUp.status === 'completed' ? (
            <p>Completed on {followUp.completedDate}.</p>
          ) : followUp.dueDate ? (
            <p>
              Due {followUp.dueDate}
              {followUp.daysUntilDue !== null && (
                <>
                  {' '}
                  (
                  {followUp.daysUntilDue < 0
                    ? `${Math.abs(followUp.daysUntilDue)} day(s) overdue`
                    : followUp.daysUntilDue === 0
                      ? 'due today'
                      : `in ${followUp.daysUntilDue} day(s)`}
                  )
                </>
              )}
            </p>
          ) : (
            <p>No due date available — add a discharge date or follow-up due date in the CSV.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">Encounter</h3>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-slate-600">
          <dt className="text-slate-400">Admission</dt>
          <dd>{record.admissionDate ?? '—'}</dd>
          <dt className="text-slate-400">Discharge</dt>
          <dd>{record.dischargeDate ?? '—'}</dd>
          <dt className="text-slate-400">ED visits (6mo)</dt>
          <dd>{record.edVisits6mo ?? 0}</dd>
        </dl>
      </section>
    </aside>
  )
}
