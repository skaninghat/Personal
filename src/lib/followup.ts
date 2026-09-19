import type { FollowUp, PatientRecord, RiskTier } from './types'

/** Default days-until-follow-up when a CSV doesn't specify a due date, by risk tier. */
const DEFAULT_FOLLOW_UP_WINDOW_DAYS: Record<RiskTier, number> = {
  high: 7,
  medium: 14,
  low: 30,
}

const DUE_SOON_WINDOW_DAYS = 3
const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

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

export function computeFollowUp(
  record: PatientRecord,
  riskTier: RiskTier,
  today: Date = new Date(),
): FollowUp {
  const completedDate = parseDate(record.followUpCompletedDate)
  if (completedDate) {
    return {
      status: 'completed',
      dueDate: record.followUpCompletedDate,
      daysUntilDue: null,
      completedDate: record.followUpCompletedDate,
    }
  }

  let dueDate = parseDate(record.followUpDueDate)
  let dueDateIso = record.followUpDueDate

  if (!dueDate) {
    const dischargeDate = parseDate(record.dischargeDate)
    if (dischargeDate) {
      dueDate = addDays(dischargeDate, DEFAULT_FOLLOW_UP_WINDOW_DAYS[riskTier])
      dueDateIso = dueDate.toISOString().slice(0, 10)
    }
  }

  if (!dueDate) {
    return { status: 'scheduled', dueDate: null, daysUntilDue: null, completedDate: null }
  }

  const daysUntilDue = daysBetween(today, dueDate)
  const status =
    daysUntilDue < 0 ? 'overdue' : daysUntilDue <= DUE_SOON_WINDOW_DAYS ? 'due-soon' : 'scheduled'

  return { status, dueDate: dueDateIso, daysUntilDue, completedDate: null }
}
