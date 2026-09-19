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

function LabRow({ testName, value, units, abnormalFlag, collectionDate }: PatientResult['clinicalSnapshot']['keyLabs'][number]) {
  const flagColor =
    abnormalFlag === 'H' ? 'text-red-700' : abnormalFlag === 'L' ? 'text-amber-700' : 'text-slate-700'
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-600">{testName}</span>
      <span className={`font-medium ${flagColor}`}>
        {value} {units ?? ''}
        {abnormalFlag && abnormalFlag !== 'N' && <span className="ml-1 text-xs">({abnormalFlag})</span>}
      </span>
      <span className="text-xs text-slate-400">{collectionDate}</span>
    </div>
  )
}

export function PatientDetail({ result, onClose }: PatientDetailProps) {
  if (!result) return null
  const { patient, lace, riskTier, followUp, latestVisit, clinicalSnapshot } = result

  return (
    <aside className="fixed inset-y-0 right-0 z-20 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{patient.name}</h2>
          <p className="text-sm text-slate-500">
            {patient.patientId} · {patient.age ?? '—'} y/o {patient.sex ?? ''}
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
        <h3 className="text-sm font-semibold text-slate-700">Clinical snapshot</h3>
        <div className="mt-2 grid grid-cols-2 gap-y-1 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
          <dt className="text-slate-400">HF type</dt>
          <dd>{clinicalSnapshot.hfType ?? '—'}</dd>
          <dt className="text-slate-400">Etiology</dt>
          <dd>{clinicalSnapshot.hfEtiology ?? '—'}</dd>
          <dt className="text-slate-400">NYHA class</dt>
          <dd>{clinicalSnapshot.nyhaClass ?? '—'}</dd>
          <dt className="text-slate-400">LVEF</dt>
          <dd>{clinicalSnapshot.lvefPct !== null ? `${clinicalSnapshot.lvefPct}%` : '—'}</dd>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">LACE Index — {lace.total} / 19</h3>
        <div className="mt-2 rounded-lg border border-slate-200 p-3">
          <ScoreRow
            label="L — Length of stay"
            points={lace.lengthOfStayPoints}
            detail={`${latestVisit.admitDate} → ${latestVisit.dischargeDate ?? latestVisit.admitDate}`}
          />
          <ScoreRow label="A — Acuity of admission" points={lace.acuityPoints} detail={latestVisit.visitType} />
          <ScoreRow
            label="C — Comorbidity (Charlson)"
            points={lace.comorbidityPoints}
            detail={
              clinicalSnapshot.activeComorbidities.length > 0
                ? clinicalSnapshot.activeComorbidities.join(', ')
                : `Charlson score: ${lace.charlsonScore}`
            }
          />
          <ScoreRow
            label="E — ED visits (prior 6mo)"
            points={lace.edVisitPoints}
            detail={`${lace.edVisitPoints} qualifying visit(s)`}
          />
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">Follow-up</h3>
        <div className="mt-2 space-y-1 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
          {followUp.dueDate ? (
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
            <p>No due date available.</p>
          )}
          <p className="text-xs text-slate-400">
            {followUp.source === 'clinician-recommended'
              ? 'From the clinician’s consult notes.'
              : 'Inferred from discharge date and risk tier — no follow-up visit scheduled yet.'}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">Latest encounter</h3>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
          <dt className="text-slate-400">Type</dt>
          <dd>{latestVisit.visitType}</dd>
          <dt className="text-slate-400">Date</dt>
          <dd>{latestVisit.admitDate}</dd>
          <dt className="text-slate-400">Facility</dt>
          <dd>{latestVisit.facility ?? '—'}</dd>
          <dt className="text-slate-400">Attending</dt>
          <dd>{latestVisit.attendingPhysicianName ?? '—'}</dd>
          <dt className="text-slate-400">Chief complaint</dt>
          <dd>{latestVisit.chiefComplaint ?? '—'}</dd>
          <dt className="text-slate-400">Diagnosis</dt>
          <dd>{latestVisit.primaryDxDescription ?? '—'}</dd>
          <dt className="text-slate-400">Disposition</dt>
          <dd>{latestVisit.disposition ?? '—'}</dd>
        </dl>
        {clinicalSnapshot.vitals && (
          <div className="mt-2 grid grid-cols-2 gap-y-1 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
            <dt className="text-slate-400">BP</dt>
            <dd>
              {clinicalSnapshot.vitals.bpSystolic ?? '—'}/{clinicalSnapshot.vitals.bpDiastolic ?? '—'} mmHg
            </dd>
            <dt className="text-slate-400">Heart rate</dt>
            <dd>{clinicalSnapshot.vitals.heartRateBpm ?? '—'} bpm</dd>
            <dt className="text-slate-400">SpO2</dt>
            <dd>{clinicalSnapshot.vitals.spo2Pct ?? '—'}%</dd>
            <dt className="text-slate-400">Weight</dt>
            <dd>{clinicalSnapshot.vitals.weightKg ?? '—'} kg</dd>
          </div>
        )}
      </section>

      {clinicalSnapshot.keyLabs.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700">Latest labs</h3>
          <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 p-3">
            {clinicalSnapshot.keyLabs.map((lab) => (
              <LabRow key={lab.testName} {...lab} />
            ))}
          </div>
        </section>
      )}

      {clinicalSnapshot.activeMedicationClasses.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700">Current medication classes</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {clinicalSnapshot.activeMedicationClasses.map((cls) => (
              <span
                key={cls}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20"
              >
                {cls}
              </span>
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}
