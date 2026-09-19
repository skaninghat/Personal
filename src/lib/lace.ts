import { charlsonScoreFromConditions } from './charlson'
import type { LaceBreakdown, PatientRecord, RiskTier } from './types'

/** L: points for length of stay, in days. */
function lengthOfStayPoints(days: number | null): number {
  if (days === null || Number.isNaN(days) || days < 0) return 0
  if (days < 1) return 0
  if (days === 1) return 1
  if (days === 2) return 2
  if (days === 3) return 3
  if (days <= 6) return 4
  if (days <= 13) return 5
  return 7
}

/** A: points for acuity of admission. */
function acuityPoints(admissionType: PatientRecord['admissionType']): number {
  return admissionType === 'emergent' ? 3 : 0
}

/** C: points for comorbidity burden, from the Charlson Comorbidity Index. */
function comorbidityPoints(charlsonScore: number): number {
  if (charlsonScore <= 0) return 0
  if (charlsonScore === 1) return 1
  if (charlsonScore === 2) return 2
  if (charlsonScore === 3) return 3
  return 5
}

/** E: points for ED visits in the 6 months prior to admission. */
function edVisitPoints(visits: number | null): number {
  if (visits === null || Number.isNaN(visits) || visits < 0) return 0
  if (visits >= 4) return 4
  return Math.round(visits)
}

export function computeLace(record: PatientRecord): LaceBreakdown {
  const charlsonScore =
    record.charlsonScoreOverride ?? charlsonScoreFromConditions(record.comorbidities)

  const l = lengthOfStayPoints(record.lengthOfStayDays)
  const a = acuityPoints(record.admissionType)
  const c = comorbidityPoints(charlsonScore)
  const e = edVisitPoints(record.edVisits6mo)

  return {
    lengthOfStayPoints: l,
    acuityPoints: a,
    comorbidityPoints: c,
    edVisitPoints: e,
    total: l + a + c + e,
    charlsonScore,
  }
}

/** Standard LACE risk-tier cutoffs (0-19 total): low 0-4, medium 5-9, high 10+. */
export function riskTierFromLace(total: number): RiskTier {
  if (total >= 10) return 'high'
  if (total >= 5) return 'medium'
  return 'low'
}
