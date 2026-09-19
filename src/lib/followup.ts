import type { FollowUp, FollowUpSource, RiskTier } from './types'

/** Default days-until-follow-up when a patient was just discharged with no visit scheduled yet, by risk tier. */
const DEFAULT_FOLLOW_UP_WINDOW_DAYS: Record<RiskTier, number> = {
  high: 7,
  medium: 14,
  low: 30,
}

const DUE_SOON_WINDOW_DAYS = 3
const MS_PER_DAY = 24 * 60 * 60 * 1000

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY)
}

export interface FollowUpInputs {
  /** The patient's most recent visit. */
  latestVisitType: string
  latestVisitDate: Date
  latestVisitDischargeDate: Date | null
  /** Earliest NextFollowUpDate among outpatient consults tied to the latest visit, if any. */
  recommendedDueDate: Date | null
  riskTier: RiskTier
}

export function computeFollowUp(inputs: FollowUpInputs, today: Date = new Date()): FollowUp {
  let dueDate: Date | null = inputs.recommendedDueDate
  let source: FollowUpSource | null = dueDate ? 'clinician-recommended' : null

  if (!dueDate) {
    const anchor = inputs.latestVisitDischargeDate ?? inputs.latestVisitDate
    dueDate = addDays(anchor, DEFAULT_FOLLOW_UP_WINDOW_DAYS[inputs.riskTier])
    source = 'inferred-post-discharge'
  }

  const daysUntilDue = daysBetween(today, dueDate)
  const status =
    daysUntilDue < 0 ? 'overdue' : daysUntilDue <= DUE_SOON_WINDOW_DAYS ? 'due-soon' : 'scheduled'

  return {
    status,
    dueDate: dueDate.toISOString().slice(0, 10),
    daysUntilDue,
    source,
  }
}
