export type RiskTier = 'high' | 'medium' | 'low'

export type FollowUpStatus = 'overdue' | 'due-soon' | 'scheduled'

export type FollowUpSource = 'clinician-recommended' | 'inferred-post-discharge'

export interface LaceBreakdown {
  lengthOfStayPoints: number
  acuityPoints: number
  comorbidityPoints: number
  edVisitPoints: number
  total: number
  charlsonScore: number
}

export interface FollowUp {
  status: FollowUpStatus
  dueDate: string | null
  daysUntilDue: number | null
  source: FollowUpSource | null
}

export interface LatestVisitSummary {
  visitId: string
  visitType: string
  admitDate: string
  dischargeDate: string | null
  facility: string | null
  chiefComplaint: string | null
  primaryDxDescription: string | null
  disposition: string | null
  attendingPhysicianName: string | null
}

export interface LabSnapshot {
  testName: string
  value: number
  units: string | null
  abnormalFlag: string | null
  collectionDate: string | null
}

export interface ClinicalSnapshot {
  hfType: string | null
  hfEtiology: string | null
  nyhaClass: string | null
  lvefPct: number | null
  vitals: {
    bpSystolic: number | null
    bpDiastolic: number | null
    heartRateBpm: number | null
    spo2Pct: number | null
    weightKg: number | null
  } | null
  keyLabs: LabSnapshot[]
  activeComorbidities: string[]
  activeMedicationClasses: string[]
}

export interface PatientSummary {
  patientId: string
  name: string
  age: number | null
  sex: string | null
}

export interface PatientResult {
  patient: PatientSummary
  lace: LaceBreakdown
  riskTier: RiskTier
  followUp: FollowUp
  latestVisit: LatestVisitSummary
  clinicalSnapshot: ClinicalSnapshot
}
