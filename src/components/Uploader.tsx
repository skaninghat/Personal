import { useRef, useState } from 'react'
import { evaluateWorkbook } from '../lib/buildDashboard'
import { parseWorkbookFile } from '../lib/xlsxImport'
import type { PatientResult } from '../lib/types'

interface UploaderProps {
  onLoaded: (results: PatientResult[], sourceName: string) => void
}

export function Uploader({ onLoaded }: UploaderProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setIsLoading(true)
    try {
      const { data, errors } = await parseWorkbookFile(file)
      setErrors(errors)
      if (data) onLoaded(evaluateWorkbook(data), file.name)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLoadSample() {
    setIsLoading(true)
    try {
      const res = await fetch('/heart-failure-sample-dataset.xlsx')
      const blob = await res.blob()
      const file = new File([blob], 'heart-failure-sample-dataset.xlsx')
      const { data, errors } = await parseWorkbookFile(file)
      setErrors(errors)
      if (data) onLoaded(evaluateWorkbook(data), 'heart-failure-sample-dataset.xlsx')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Patient Risk &amp; Follow-Up Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Upload a patient dataset workbook to stratify risk with the LACE Index and see which
        patients need follow-up outreach.
      </p>

      <div className="mt-8 rounded-xl border-2 border-dashed border-slate-300 bg-white p-10">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
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
          {isLoading ? 'Loading…' : 'Upload patient workbook (.xlsx)'}
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
          <p className="font-medium">Couldn't load this workbook:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-8 text-left text-sm text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-700">Expected workbook schema</summary>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><code>1_Patients</code>: one row per patient (PatientID, name, demographics, HF type/etiology, baseline LVEF, NYHA class)</li>
          <li><code>1b_Comorbidities</code>: one row per patient-condition, with a real ICD-10 code (drives the Charlson comorbidity score)</li>
          <li><code>2_Visits</code>: one row per encounter (VisitID, PatientID, VisitType, admission/discharge dates, length of stay, vitals)</li>
          <li><code>3c_OP_Consultations</code>: one row per outpatient consult, with a <code>NextFollowUpDate</code></li>
          <li>Optional: <code>3a_LabResults</code>, <code>3d_Medications</code>, <code>4_Physicians</code> — used for the clinical snapshot panel</li>
        </ul>
      </details>
    </div>
  )
}
