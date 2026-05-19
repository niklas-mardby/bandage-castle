import { describe, expect, it } from 'vitest'
import { toCsv } from './reports.service'

describe('toCsv', () => {
  it('is empty for no rows', () => {
    expect(toCsv([])).toBe('')
  })

  it('writes a header and one line per row', () => {
    expect(toCsv([{ reason: 'BOARDING', gold: 12.5 }, { reason: 'THERAPY', gold: 3 }])).toBe('reason,gold\nBOARDING,12.5\nTHERAPY,3\n')
  })

  it('quotes commas, quotes and newlines', () => {
    expect(toCsv([{ name: 'Malgrim, the Unpleasant', note: 'said "no"\nloudly' }])).toBe('name,note\n"Malgrim, the Unpleasant","said ""no""\nloudly"\n')
  })

  it('leaves empty cells for null', () => {
    expect(toCsv([{ a: null, b: undefined, c: 0 }])).toBe('a,b,c\n,,0\n')
  })
})
