import { describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({ prisma: {} }))

import { isLowStock } from './supplies.service'

describe('isLowStock', () => {
  it('flags supplies below the reorder level', () => {
    expect(isLowStock({ quantity: 2, lowStockThreshold: 5 })).toBe(true)
  })

  it('does not flag well-stocked supplies', () => {
    expect(isLowStock({ quantity: 40, lowStockThreshold: 10 })).toBe(false)
  })

  it('flags supplies that ran out completely', () => {
    expect(isLowStock({ quantity: 0, lowStockThreshold: 1 })).toBe(true)
  })

  it('ignores items without a reorder level', () => {
    expect(isLowStock({ quantity: 0, lowStockThreshold: 0 })).toBe(false)
  })
})
