export type VisitType = 'Inpatient' | 'Emergency' | 'Outpatient - Clinic' | 'Outpatient - Follow-up'

export interface PatientRow {
  patientId: string
  firstName: string | null
  lastName: string | null
  gender: string | null
  dateOfBirth: Date | null
  age: number | null
  hfType: string | null
  hfEtiology: string | null
  baselineLvefPct: number | null
  nyhaClassBaseline: string | null
  comorbiditiesText: string | null
}

export interface ComorbidityRow {
  patientId: string
  icd10Code: string
  condition: string | null
  status: string | null
}

export interface VisitRow {
  visitId: string
  patientId: string
  visitType: string
  admitDate: Date
  dischargeDate: Date | null
  lengthOfStayDays: number | null
  facility: string | null
  attendingPhysicianId: string | null
  chiefComplaint: string | null
  primaryDxDescription: string | null
  bpSystolic: number | null
  bpDiastolic: number | null
  heartRateBpm: number | null
  respRate: number | null
  spo2Pct: number | null
  weightKg: number | null
  disposition: string | null
}

export interface ConsultationRow {
  consultId: string
  visitId: string
  patientId: string
  consultDate: Date | null
  physicianId: string | null
  specialty: string | null
  plan: string | null
  nextFollowUpDate: Date | null
}

export interface LabResultRow {
  visitId: string
  patientId: string
  collectionDate: Date | null
  testName: string
  resultValue: number | null
  units: string | null
  abnormalFlag: string | null
}

export interface MedicationRow {
  patientId: string
  visitId: string | null
  drugName: string | null
  drugClass: string | null
  orderDate: Date | null
  orderStatus: string | null
}

export interface PhysicianRow {
  physicianId: string
  physicianName: string | null
  specialty: string | null
}

export interface WorkbookData {
  patients: PatientRow[]
  comorbidities: ComorbidityRow[]
  visits: VisitRow[]
  consultations: ConsultationRow[]
  labResults: LabResultRow[]
  medications: MedicationRow[]
  physicians: PhysicianRow[]
}
