import { charlsonScoreFromIcd10Codes } from './charlsonIcd10'
import { computeFollowUp } from './followup'
import { computeLace, riskTierFromLace } from './lace'
import type {
  ComorbidityRow,
  LabResultRow,
  MedicationRow,
  PatientRow,
  PhysicianRow,
  VisitRow,
  WorkbookData,
} from './schema'
import type { ClinicalSnapshot, LabSnapshot, LatestVisitSummary, PatientResult } from './types'

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000
const KEY_LAB_PRIORITY = ['BNP', 'NT-proBNP', 'Creatinine', 'eGFR', 'Sodium', 'Potassium']

function toIsoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const group = map.get(key)
    if (group) group.push(item)
    else map.set(key, [item])
  }
  return map
}

function buildClinicalSnapshot(
  patient: PatientRow,
  latestVisit: VisitRow,
  comorbidities: ComorbidityRow[],
  labsByPatient: Map<string, LabResultRow[]>,
  medsByPatient: Map<string, MedicationRow[]>,
): ClinicalSnapshot {
  const patientLabs = labsByPatient.get(patient.patientId) ?? []
  const latestByTest = new Map<string, LabResultRow>()
  for (const lab of patientLabs) {
    if (lab.resultValue === null) continue
    const existing = latestByTest.get(lab.testName)
    if (!existing || (lab.collectionDate?.getTime() ?? 0) > (existing.collectionDate?.getTime() ?? 0)) {
      latestByTest.set(lab.testName, lab)
    }
  }
  const keyLabs: LabSnapshot[] = KEY_LAB_PRIORITY.map((testName) => latestByTest.get(testName))
    .filter((lab): lab is LabResultRow => lab !== undefined)
    .map((lab) => ({
      testName: lab.testName,
      value: lab.resultValue as number,
      units: lab.units,
      abnormalFlag: lab.abnormalFlag,
      collectionDate: toIsoDate(lab.collectionDate),
    }))

  const activeComorbidities = comorbidities
    .filter((c) => c.status === null || c.status === 'Active')
    .map((c) => c.condition ?? c.icd10Code)

  const activeMedicationClasses = Array.from(
    new Set(
      (medsByPatient.get(patient.patientId) ?? [])
        .filter((m) => m.visitId === latestVisit.visitId)
        .map((m) => m.drugClass)
        .filter((c): c is string => c !== null),
    ),
  ).sort()

  return {
    hfType: patient.hfType,
    hfEtiology: patient.hfEtiology,
    nyhaClass: patient.nyhaClassBaseline,
    lvefPct: patient.baselineLvefPct,
    vitals: {
      bpSystolic: latestVisit.bpSystolic,
      bpDiastolic: latestVisit.bpDiastolic,
      heartRateBpm: latestVisit.heartRateBpm,
      spo2Pct: latestVisit.spo2Pct,
      weightKg: latestVisit.weightKg,
    },
    keyLabs,
    activeComorbidities,
    activeMedicationClasses,
  }
}

export function evaluateWorkbook(data: WorkbookData, today: Date = new Date()): PatientResult[] {
  const visitsByPatient = groupBy(data.visits, (v) => v.patientId)
  const comorbiditiesByPatient = groupBy(data.comorbidities, (c) => c.patientId)
  const consultsByVisit = groupBy(data.consultations, (c) => c.visitId)
  const labsByPatient = groupBy(data.labResults, (l) => l.patientId)
  const medsByPatient = groupBy(data.medications, (m) => m.patientId)
  const physicianById = new Map<string, PhysicianRow>(data.physicians.map((p) => [p.physicianId, p]))

  const results: PatientResult[] = []

  for (const patient of data.patients) {
    const visits = [...(visitsByPatient.get(patient.patientId) ?? [])].sort(
      (a, b) => a.admitDate.getTime() - b.admitDate.getTime(),
    )
    if (visits.length === 0) continue

    const latestVisit = visits[visits.length - 1]
    const patientComorbidities = comorbiditiesByPatient.get(patient.patientId) ?? []
    const charlsonScore = charlsonScoreFromIcd10Codes(patientComorbidities.map((c) => c.icd10Code))

    const priorEdVisits6mo = visits.filter(
      (v) =>
        v.visitId !== latestVisit.visitId &&
        v.visitType === 'Emergency' &&
        v.admitDate.getTime() < latestVisit.admitDate.getTime() &&
        v.admitDate.getTime() >= latestVisit.admitDate.getTime() - SIX_MONTHS_MS,
    ).length

    const lace = computeLace({
      lengthOfStayDays: latestVisit.lengthOfStayDays ?? 0,
      visitType: latestVisit.visitType,
      charlsonScore,
      priorEdVisits6mo,
    })
    const riskTier = riskTierFromLace(lace.total)

    const consultsForVisit = consultsByVisit.get(latestVisit.visitId) ?? []
    const followUpDates = consultsForVisit
      .map((c) => c.nextFollowUpDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())

    const followUp = computeFollowUp(
      {
        latestVisitType: latestVisit.visitType,
        latestVisitDate: latestVisit.admitDate,
        latestVisitDischargeDate: latestVisit.dischargeDate,
        recommendedDueDate: followUpDates[0] ?? null,
        riskTier,
      },
      today,
    )

    const latestVisitSummary: LatestVisitSummary = {
      visitId: latestVisit.visitId,
      visitType: latestVisit.visitType,
      admitDate: toIsoDate(latestVisit.admitDate) ?? '',
      dischargeDate: toIsoDate(latestVisit.dischargeDate),
      facility: latestVisit.facility,
      chiefComplaint: latestVisit.chiefComplaint,
      primaryDxDescription: latestVisit.primaryDxDescription,
      disposition: latestVisit.disposition,
      attendingPhysicianName: latestVisit.attendingPhysicianId
        ? (physicianById.get(latestVisit.attendingPhysicianId)?.physicianName ?? null)
        : null,
    }

    const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.patientId

    results.push({
      patient: { patientId: patient.patientId, name, age: patient.age, sex: patient.gender },
      lace,
      riskTier,
      followUp,
      latestVisit: latestVisitSummary,
      clinicalSnapshot: buildClinicalSnapshot(patient, latestVisit, patientComorbidities, labsByPatient, medsByPatient),
    })
  }

  return results
}
