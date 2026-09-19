import { useRef, useState } from 'react'
import { parseCsvFile, parseCsvText } from '../lib/csv'
import type { PatientRecord } from '../lib/types'

interface UploaderProps {
  onLoaded: (records: PatientRecord[], sourceName: string) => void
}

export function Uploader({ onLoaded }: UploaderProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setIsLoading(true)
    try {
      const { records, errors } = await parseCsvFile(file)
      setErrors(errors)
      if (records.length > 0) onLoaded(records, file.name)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLoadSample() {
    setIsLoading(true)
    try {
      const res = await fetch('/sample-patients.csv')
      const text = await res.text()
      const { records, errors } = parseCsvText(text)
      setErrors(errors)
      if (records.length > 0) onLoaded(records, 'sample-patients.csv')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Patient Risk &amp; Follow-Up Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Upload a CSV of patient encounters to stratify risk with the LACE Index and see which
        patients need follow-up outreach.
      </p>

      <div className="mt-8 rounded-xl border-2 border-dashed border-slate-300 bg-white p-10">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading…' : 'Upload patient CSV'}
        </button>
        <p className="mt-4 text-sm text-slate-500">or</p>
        <button
          type="button"
          onClick={() => void handleLoadSample()}
          disabled={isLoading}
          className="mt-2 text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 disabled:opacity-50"
        >
          Load sample data
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-left text-sm text-amber-800 ring-1 ring-amber-200">
          <p className="font-medium">Some rows had issues:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-8 text-left text-sm text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-700">Expected CSV columns</summary>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><code>patient_id</code>, <code>name</code>, <code>age</code>, <code>sex</code></li>
          <li><code>admission_date</code>, <code>discharge_date</code> (or <code>length_of_stay_days</code>)</li>
          <li><code>admission_type</code>: emergent / urgent / elective</li>
          <li><code>comorbidities</code>: semicolon-separated conditions (e.g. <code>chf;copd;diabetes</code>), or a precomputed <code>charlson_score</code></li>
          <li><code>ed_visits_6mo</code>: ED visits in the 6 months before admission</li>
          <li><code>follow_up_due_date</code>, <code>follow_up_completed_date</code> (optional — a due date is inferred from discharge date and risk tier if omitted)</li>
        </ul>
      </details>
    </div>
  )
}
