import ExcelJS from 'exceljs'
import type {
  ComorbidityRow,
  ConsultationRow,
  LabResultRow,
  MedicationRow,
  PatientRow,
  PhysicianRow,
  VisitRow,
  WorkbookData,
} from './schema'
import { asDate, asNumber, asString, sheetToRows } from './workbookUtils'

const REQUIRED_SHEETS = ['1_Patients', '1b_Comorbidities', '2_Visits', '3c_OP_Consultations'] as const

export interface ParseWorkbookResult {
  data: WorkbookData | null
  errors: string[]
}

export async function parseWorkbookFile(file: File): Promise<ParseWorkbookResult> {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(buffer)
  } catch {
    return { data: null, errors: ['Could not read this file as an Excel workbook (.xlsx).'] }
  }

  const errors: string[] = []
  const missing = REQUIRED_SHEETS.filter((name) => !workbook.getWorksheet(name))
  if (missing.length > 0) {
    return {
      data: null,
      errors: [
        `Missing required sheet(s): ${missing.join(', ')}. Expected the standard patient dataset workbook ` +
          `(sheets: ${REQUIRED_SHEETS.join(', ')}, plus optional 3a_LabResults / 3d_Medications / 4_Physicians).`,
      ],
    }
  }

  const patients = mapPatients(sheetToRows(workbook.getWorksheet('1_Patients')!), errors)
  const comorbidities = mapComorbidities(sheetToRows(workbook.getWorksheet('1b_Comorbidities')!))
  const visits = mapVisits(sheetToRows(workbook.getWorksheet('2_Visits')!), errors)
  const consultations = mapConsultations(sheetToRows(workbook.getWorksheet('3c_OP_Consultations')!))

  const labsSheet = workbook.getWorksheet('3a_LabResults')
  const labResults = labsSheet ? mapLabResults(sheetToRows(labsSheet)) : []

  const medsSheet = workbook.getWorksheet('3d_Medications')
  const medications = medsSheet ? mapMedications(sheetToRows(medsSheet)) : []

  const physSheet = workbook.getWorksheet('4_Physicians')
  const physicians = physSheet ? mapPhysicians(sheetToRows(physSheet)) : []

  if (patients.length === 0) errors.push('No patients found in 1_Patients.')

  return {
    data: { patients, comorbidities, visits, consultations, labResults, medications, physicians },
    errors,
  }
}

function mapPatients(rows: Record<string, unknown>[], errors: string[]): PatientRow[] {
  const result: PatientRow[] = []
  rows.forEach((row, i) => {
    const patientId = asString(row.PatientID)
    if (!patientId) {
      errors.push(`1_Patients row ${i + 2}: missing PatientID, row skipped.`)
      return
    }
    result.push({
      patientId,
      firstName: asString(row.FirstName),
      lastName: asString(row.LastName),
      gender: asString(row.Gender),
      dateOfBirth: asDate(row.DateOfBirth),
      age: asNumber(row.Age),
      hfType: asString(row.HF_Type),
      hfEtiology: asString(row.HF_Etiology),
      baselineLvefPct: asNumber(row.BaselineLVEF_pct),
      nyhaClassBaseline: asString(row.NYHA_Class_Baseline),
      comorbiditiesText: asString(row.Comorbidities),
    })
  })
  return result
}

function mapComorbidities(rows: Record<string, unknown>[]): ComorbidityRow[] {
  return rows
    .map((row) => ({
      patientId: asString(row.PatientID),
      icd10Code: asString(row.ICD10_Code),
      condition: asString(row.Condition),
      status: asString(row.Status),
    }))
    .filter((r): r is ComorbidityRow => r.patientId !== null && r.icd10Code !== null)
}

function mapVisits(rows: Record<string, unknown>[], errors: string[]): VisitRow[] {
  const result: VisitRow[] = []
  rows.forEach((row, i) => {
    const visitId = asString(row.VisitID)
    const patientId = asString(row.PatientID)
    const admitDate = asDate(row.AdmitOrVisitDate)
    if (!visitId || !patientId || !admitDate) {
      errors.push(`2_Visits row ${i + 2}: missing VisitID, PatientID, or AdmitOrVisitDate, row skipped.`)
      return
    }
    result.push({
      visitId,
      patientId,
      visitType: asString(row.VisitType) ?? 'Outpatient - Clinic',
      admitDate,
      dischargeDate: asDate(row.DischargeDate),
      lengthOfStayDays: asNumber(row.LengthOfStay_days),
      facility: asString(row.Facility),
      attendingPhysicianId: asString(row.AttendingPhysicianID),
      chiefComplaint: asString(row.ChiefComplaint),
      primaryDxDescription: asString(row.PrimaryDx_Description),
      bpSystolic: asNumber(row.BP_Systolic),
      bpDiastolic: asNumber(row.BP_Diastolic),
      heartRateBpm: asNumber(row.HeartRate_bpm),
      respRate: asNumber(row.RespRate),
      spo2Pct: asNumber(row.SpO2_pct),
      weightKg: asNumber(row.Weight_kg),
      disposition: asString(row.Disposition),
    })
  })
  return result
}

function mapConsultations(rows: Record<string, unknown>[]): ConsultationRow[] {
  return rows
    .map((row) => ({
      consultId: asString(row.ConsultID),
      visitId: asString(row.VisitID),
      patientId: asString(row.PatientID),
      consultDate: asDate(row.ConsultDate),
      physicianId: asString(row.PhysicianID),
      specialty: asString(row.Specialty),
      plan: asString(row.Plan),
      nextFollowUpDate: asDate(row.NextFollowUpDate),
    }))
    .filter((r): r is ConsultationRow => r.consultId !== null && r.visitId !== null && r.patientId !== null)
}

function mapLabResults(rows: Record<string, unknown>[]): LabResultRow[] {
  return rows
    .map((row) => ({
      visitId: asString(row.VisitID),
      patientId: asString(row.PatientID),
      collectionDate: asDate(row.CollectionDate),
      testName: asString(row.TestName),
      resultValue: asNumber(row.ResultValue),
      units: asString(row.Units),
      abnormalFlag: asString(row.AbnormalFlag),
    }))
    .filter((r): r is LabResultRow => r.patientId !== null && r.testName !== null)
}

function mapMedications(rows: Record<string, unknown>[]): MedicationRow[] {
  return rows.map((row) => ({
    patientId: asString(row.PatientID) ?? '',
    visitId: asString(row.VisitID),
    drugName: asString(row.DrugName),
    drugClass: asString(row.DrugClass),
    orderDate: asDate(row.OrderDate),
    orderStatus: asString(row.OrderStatus),
  }))
}

function mapPhysicians(rows: Record<string, unknown>[]): PhysicianRow[] {
  return rows
    .map((row) => ({
      physicianId: asString(row.PhysicianID),
      physicianName: asString(row.PhysicianName),
      specialty: asString(row.Specialty),
    }))
    .filter((r): r is PhysicianRow => r.physicianId !== null)
}
