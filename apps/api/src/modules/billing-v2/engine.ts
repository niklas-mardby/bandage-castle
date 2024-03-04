// The Billing v2 engine ✨
// Pure functions: stay in, invoice lines out. Everything in copper.
import { differenceInCalendarDays } from 'date-fns'
import { toCopper, type Copper } from '@bandage/shared'

export const LATE_FEE_PER_DAY: Copper = 2500 // 25 gp, same as the old system
export const TREATMENT_SUPPLIES_PER_NIGHT: Copper = 500 // bandages & potions, 5 gp/night
export const SURRENDER_ADMIN_FEE: Copper = 10000 // 100 gp, one-off

export type BillableStay = {
  id: number
  reason: string
  startDate: Date | null
  checkedInAt: Date | null
  checkedOutAt: Date | null
  expectedPickup: Date | null
  /** legacy column, gold as DECIMAL */
  dailyRate: number | string | null
}

export type LineDraft = {
  description: string
  quantity: number
  unitCopper: Copper
  amountCopper: Copper
  kind: 'STAY' | 'TREATMENT' | 'THERAPY' | 'LATE_FEE' | 'DISCOUNT' | 'OTHER'
}

export function nightsBetween(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(end, start))
}

/** Whole days after the agreed pickup day. Picking up ON the day is free. */
export function lateDays(expectedPickup: Date | null, checkedOut: Date): number {
  if (!expectedPickup) return 0
  return Math.max(0, differenceInCalendarDays(checkedOut, expectedPickup))
}

function line(description: string, quantity: number, unitCopper: Copper, kind: LineDraft['kind']): LineDraft {
  return { description, quantity, unitCopper, amountCopper: quantity * unitCopper, kind }
}

export function buildLines(stay: BillableStay, asOf: Date = new Date()): LineDraft[] {
  const start = stay.checkedInAt ?? stay.startDate ?? asOf
  const end = stay.checkedOutAt ?? asOf
  const nights = nightsBetween(start, end)
  const rate = toCopper(stay.dailyRate ?? 10)
  const reason = stay.reason.toLowerCase()

  const lines: LineDraft[] = [line(`${nights} night${nights === 1 ? '' : 's'} (${reason})`, nights, rate, 'STAY')]

  if (stay.reason === 'TREATMENT') {
    lines.push(line('Bandages, salves & potions', nights, TREATMENT_SUPPLIES_PER_NIGHT, 'TREATMENT'))
  }
  if (stay.reason === 'SURRENDER') {
    lines.push(line('Surrender administration', 1, SURRENDER_ADMIN_FEE, 'OTHER'))
  }

  const late = stay.reason === 'SURRENDER' ? 0 : lateDays(stay.expectedPickup, end)
  if (late > 0) {
    lines.push(line(`Late pickup (${late} day${late === 1 ? '' : 's'})`, late, LATE_FEE_PER_DAY, 'LATE_FEE'))
  }
  return lines
}

export function totalOf(lines: Pick<LineDraft, 'amountCopper'>[]): Copper {
  return lines.reduce((sum, l) => sum + l.amountCopper, 0)
}

/** BC-2024-000123 */
export function invoiceNumber(year: number, sequence: number): string {
  return `BC-${year}-${String(sequence).padStart(6, '0')}`
}
