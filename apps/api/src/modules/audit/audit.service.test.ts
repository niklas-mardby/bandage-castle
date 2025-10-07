import { describe, expect, it } from 'vitest'
import { diff } from './audit.service'

describe('audit diff', () => {
  it('keeps only changed fields', () => {
    expect(diff({ title: 'Portcullis', priority: 'LOW', status: 'OPEN' }, { title: 'Portcullis', priority: 'HIGH', status: 'OPEN' })).toEqual({
      before: { priority: 'LOW' },
      after: { priority: 'HIGH' },
    })
  })

  it('ignores updatedAt', () => {
    expect(diff({ a: 1, updatedAt: 'x' }, { a: 1, updatedAt: 'y' })).toEqual({ before: {}, after: {} })
  })

  it('compares dates and objects by value', () => {
    const d = new Date('2025-10-01')
    expect(diff({ due: d }, { due: new Date('2025-10-01') })).toEqual({ before: {}, after: {} })
  })

  it('passes through creates and deletes', () => {
    expect(diff(null, { a: 1 })).toEqual({ before: null, after: { a: 1 } })
    expect(diff({ a: 1 }, undefined)).toEqual({ before: { a: 1 }, after: null })
  })
})
