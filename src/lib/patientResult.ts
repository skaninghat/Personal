import { computeFollowUp } from './followup'
import { computeLace, riskTierFromLace } from './lace'
import type { PatientRecord, PatientResult } from './types'

export function evaluatePatient(record: PatientRecord): PatientResult {
  const lace = computeLace(record)
  const riskTier = riskTierFromLace(lace.total)
  const followUp = computeFollowUp(record, riskTier)
  return { record, lace, riskTier, followUp }
}

export function evaluatePatients(records: PatientRecord[]): PatientResult[] {
  return records.map(evaluatePatient)
}
