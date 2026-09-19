import Papa from 'papaparse'
import type { AdmissionType, PatientRecord } from './types'

/** Maps normalized header names -> canonical field. Add aliases here as needed. */
const HEADER_ALIASES: Record<string, string> = {
  patientid: 'patientId',
  id: 'patientId',
  mrn: 'patientId',
  patientname: 'name',
  name: 'name',
  age: 'age',
  sex: 'sex',
  gender: 'sex',
  admissiondate: 'admissionDate',
  admitdate: 'admissionDate',
  dischargedate: 'dischargeDate',
  lengthofstaydays: 'lengthOfStayDays',
  lengthofstay: 'lengthOfStayDays',
  los: 'lengthOfStayDays',
  admissiontype: 'admissionType',
  acuity: 'admissionType',
  comorbidities: 'comorbidities',
  conditions: 'comorbidities',
  charlsonscore: 'charlsonScoreOverride',
  edvisits6mo: 'edVisits6mo',
  edvisits: 'edVisits6mo',
  edvisitcount: 'edVisits6mo',
  followupduedate: 'followUpDueDate',
  followupcompleteddate: 'followUpCompletedDate',
  followupdone: 'followUpCompletedDate',
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
}

function toNumberOrNull(value: string | undefined): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const num = Number(trimmed)
  return Number.isNaN(num) ? null : num
}

function toStringOrNull(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function toAdmissionType(value: string | undefined): AdmissionType | null {
  const trimmed = value?.trim().toLowerCase()
  if (trimmed === 'emergent' || trimmed === 'emergency' || trimmed === 'ed') return 'emergent'
  if (trimmed === 'urgent') return 'urgent'
  if (trimmed === 'elective' || trimmed === 'planned') return 'elective'
  return null
}

function daysBetweenDates(from: string | null, to: string | null): number | null {
  if (!from || !to) return null
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000))
  return days < 0 ? null : days
}

function rowToRecord(row: Record<string, string>, index: number): PatientRecord {
  const mapped: Record<string, string | undefined> = {}
  for (const [rawHeader, value] of Object.entries(row)) {
    const canonical = HEADER_ALIASES[normalizeHeader(rawHeader)]
    if (canonical) mapped[canonical] = value
  }

  const admissionDate = toStringOrNull(mapped.admissionDate)
  const dischargeDate = toStringOrNull(mapped.dischargeDate)
  const lengthOfStayDays =
    toNumberOrNull(mapped.lengthOfStayDays) ?? daysBetweenDates(admissionDate, dischargeDate)

  const comorbiditiesRaw = toStringOrNull(mapped.comorbidities)
  const comorbidities = comorbiditiesRaw
    ? comorbiditiesRaw
        .split(/[;|]/)
        .map((c) => c.trim())
        .filter(Boolean)
    : []

  return {
    patientId: toStringOrNull(mapped.patientId) ?? `row-${index + 1}`,
    name: toStringOrNull(mapped.name) ?? `Unnamed patient ${index + 1}`,
    age: toNumberOrNull(mapped.age),
    sex: toStringOrNull(mapped.sex),
    admissionDate,
    dischargeDate,
    lengthOfStayDays,
    admissionType: toAdmissionType(mapped.admissionType),
    comorbidities,
    charlsonScoreOverride: toNumberOrNull(mapped.charlsonScoreOverride),
    edVisits6mo: toNumberOrNull(mapped.edVisits6mo),
    followUpDueDate: toStringOrNull(mapped.followUpDueDate),
    followUpCompletedDate: toStringOrNull(mapped.followUpCompletedDate),
  }
}

export interface ParseCsvResult {
  records: PatientRecord[]
  errors: string[]
}

export function parseCsvText(text: string): ParseCsvResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  const errors = parsed.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`)

  if (parsed.data.length === 0) {
    return { records: [], errors: [...errors, 'No data rows found in CSV.'] }
  }

  const firstRowKeys = Object.keys(parsed.data[0]).map(normalizeHeader)
  if (!firstRowKeys.includes('patientid') && !firstRowKeys.includes('id') && !firstRowKeys.includes('mrn')) {
    errors.push('No patient ID column found (expected one of: patient_id, id, mrn). Rows will use generated IDs.')
  }

  const records = parsed.data.map((row, index) => rowToRecord(row, index))
  return { records, errors }
}

export function parseCsvFile(file: File): Promise<ParseCsvResult> {
  return file.text().then(parseCsvText)
}
