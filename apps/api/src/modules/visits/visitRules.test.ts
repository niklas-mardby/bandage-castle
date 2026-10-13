import { describe, expect, it } from 'vitest'
import { slotsFor, visitProblem } from './visitRules'

const hours = { visitingFrom: '10:00', visitingUntil: '16:00', closedDays: ['SUN'] }
const now = new Date(2026, 9, 12, 9, 0) // Monday 12 Oct 2026, 09:00

describe('visitProblem', () => {
  it('accepts a normal visit', () => {
    expect(visitProblem(hours, new Date(2026, 9, 14, 11, 0), 30, 2, now)).toBeNull()
  })

  it('needs an hour of notice', () => {
    expect(visitProblem(hours, new Date(2026, 9, 12, 9, 30), 30, 1, now)).toMatch(/hour ahead/)
  })

  it('respects closed days', () => {
    expect(visitProblem(hours, new Date(2026, 9, 18, 11, 0), 30, 1, now)).toMatch(/closed/)
  })

  it('respects visiting hours, including the end of the visit', () => {
    expect(visitProblem(hours, new Date(2026, 9, 14, 9, 30), 30, 1, now)).toMatch(/Visiting hours/)
    expect(visitProblem(hours, new Date(2026, 9, 14, 15, 30), 60, 1, now)).toMatch(/Visiting hours/)
  })

  it('only allows half-hour slots', () => {
    expect(visitProblem(hours, new Date(2026, 9, 14, 11, 15), 30, 1, now)).toMatch(/half past/)
  })

  it('limits guests', () => {
    expect(visitProblem(hours, new Date(2026, 9, 14, 11, 0), 30, 9, now)).toMatch(/guests/)
  })
})

describe('slotsFor', () => {
  it('lists half-hour slots that fit before closing', () => {
    const slots = slotsFor(hours, 60)
    expect(slots[0]).toBe('10:00')
    expect(slots[slots.length - 1]).toBe('15:00')
    expect(slots).toHaveLength(11)
  })
})
