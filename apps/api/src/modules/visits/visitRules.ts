// Pure rules for when owners may visit. Kept separate so they are easy to test.

export type VisitingHours = { visitingFrom: string; visitingUntil: string; closedDays: string[] }

const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export const MAX_GUESTS = 4
export const MAX_VISITS_PER_SLOT = 3
export const SLOT_MINUTES = 30

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Returns a reason the visit is not allowed, or null if it is fine. Times are castle-local. */
export function visitProblem(hours: VisitingHours, visitAt: Date, durationMin: number, guests: number, now: Date = new Date()): string | null {
  if (visitAt.getTime() < now.getTime() + 60 * 60 * 1000) return 'Visits must be booked at least an hour ahead'
  if (hours.closedDays.includes(DAY_CODES[visitAt.getDay()])) return 'The castle is closed to visitors that day'
  const start = visitAt.getHours() * 60 + visitAt.getMinutes()
  if (start % SLOT_MINUTES !== 0) return `Visits start on the hour or half past`
  if (start < minutes(hours.visitingFrom) || start + durationMin > minutes(hours.visitingUntil)) {
    return `Visiting hours are ${hours.visitingFrom}–${hours.visitingUntil}`
  }
  if (guests < 1 || guests > MAX_GUESTS) return `Between 1 and ${MAX_GUESTS} guests, please (the drawbridge has a weight limit)`
  if (durationMin > 120) return 'Visits are at most two hours'
  return null
}

/** All bookable start times on a day, as "HH:MM". */
export function slotsFor(hours: VisitingHours, durationMin = SLOT_MINUTES): string[] {
  const slots: string[] = []
  for (let t = minutes(hours.visitingFrom); t + durationMin <= minutes(hours.visitingUntil); t += SLOT_MINUTES) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return slots
}
