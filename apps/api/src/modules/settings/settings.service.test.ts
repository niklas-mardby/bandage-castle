import { describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({ prisma: {} }))

import { SETTING_SCHEMAS } from './settings.service'

describe('setting schemas', () => {
  it('accepts sensible opening hours', () => {
    const ok = SETTING_SCHEMAS.opening_hours.safeParse({ open: '08:00', close: '20:00', closedDays: ['SUN'], visitingFrom: '10:00', visitingUntil: '16:00' })
    expect(ok.success).toBe(true)
  })

  it('rejects made-up weekdays', () => {
    const bad = SETTING_SCHEMAS.opening_hours.safeParse({ open: '08:00', close: '20:00', closedDays: ['FUNDAY'], visitingFrom: '10:00', visitingUntil: '16:00' })
    expect(bad.success).toBe(false)
  })

  it('rejects negative prices', () => {
    expect(SETTING_SCHEMAS.prices.safeParse({ defaultDailyRateGold: -1, lateFeePerDayGold: 25, treatmentSuppliesPerNightGold: 5 }).success).toBe(false)
  })

  it('needs a castle name', () => {
    expect(SETTING_SCHEMAS.castle.safeParse({ name: '', motto: '', emergencyRaven: '' }).success).toBe(false)
  })
})
