import { describe, expect, it } from 'vitest'
import { buildLines, invoiceNumber, lateDays, nightsBetween, totalOf } from './engine'

const d = (s: string) => new Date(s)

describe('billing v2 engine', () => {
  it('counts calendar nights', () => {
    expect(nightsBetween(d('2024-03-01T10:00:00'), d('2024-03-04T09:00:00'))).toBe(3)
    expect(nightsBetween(d('2024-03-01T10:00:00'), d('2024-03-01T18:00:00'))).toBe(1)
  })

  it('does not charge a late fee on the pickup day', () => {
    expect(lateDays(d('2024-03-05'), d('2024-03-05T17:00:00'))).toBe(0)
    expect(lateDays(d('2024-03-05'), d('2024-03-07T09:00:00'))).toBe(2)
  })

  it('bills a simple boarding stay', () => {
    const lines = buildLines({
      id: 1,
      reason: 'BOARDING',
      startDate: d('2024-03-01'),
      checkedInAt: d('2024-03-01T10:00:00'),
      checkedOutAt: d('2024-03-08T10:00:00'),
      expectedPickup: d('2024-03-08'),
      dailyRate: '12.50',
    })
    expect(lines).toEqual([{ description: '7 nights (boarding)', quantity: 7, unitCopper: 1250, amountCopper: 8750, kind: 'STAY' }])
    expect(totalOf(lines)).toBe(8750)
  })

  it('adds treatment supplies and late fees', () => {
    const lines = buildLines({
      id: 2,
      reason: 'TREATMENT',
      startDate: d('2024-03-01'),
      checkedInAt: d('2024-03-01T10:00:00'),
      checkedOutAt: d('2024-03-06T10:00:00'),
      expectedPickup: d('2024-03-04'),
      dailyRate: 20,
    })
    expect(lines.map((l) => l.kind)).toEqual(['STAY', 'TREATMENT', 'LATE_FEE'])
    expect(totalOf(lines)).toBe(5 * 2000 + 5 * 500 + 2 * 2500)
  })

  it('formats invoice numbers', () => {
    expect(invoiceNumber(2024, 42)).toBe('BC-2024-000042')
  })
})
