export type AdmissionType = 'emergent' | 'urgent' | 'elective'

export type RiskTier = 'high' | 'medium' | 'low'

export type FollowUpStatus = 'completed' | 'overdue' | 'due-soon' | 'scheduled'

/** One row of clinician-supplied CSV data, after column mapping. */
export interface PatientRecord {
  patientId: string
  name: string
  age: number | null
  sex: string | null
  admissionDate: string | null
  dischargeDate: string | null
  lengthOfStayDays: number | null
  admissionType: AdmissionType | null
  comorbidities: string[]
  charlsonScoreOverride: number | null
  edVisits6mo: number | null
  followUpDueDate: string | null
  followUpCompletedDate: string | null
}

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
  completedDate: string | null
}

export interface PatientResult {
  record: PatientRecord
  lace: LaceBreakdown
  riskTier: RiskTier
  followUp: FollowUp
}
