import { describe, expect, it } from 'vitest'
import { formatCopper, fromCopper, splitCopper, toCopper, toGoldString } from './money'

describe('toGoldString', () => {
  it('formats with two decimals and a thousands separator', () => {
    expect(toGoldString(1234.5)).toBe('1,234.50 gp')
  })

  it('accepts strings from DECIMAL columns', () => {
    expect(toGoldString('99.90')).toBe('99.90 gp')
  })

  it('treats null as zero', () => {
    expect(toGoldString(null)).toBe('0.00 gp')
  })
})

describe('copper', () => {
  it('converts gold to copper without float drift', () => {
    expect(toCopper(4.35)).toBe(435)
    expect(toCopper('1.15')).toBe(115)
    expect(toCopper(0.1 + 0.2)).toBe(30)
  })

  it('converts back for display maths', () => {
    expect(fromCopper(1234)).toBe(12.34)
  })

  it('formats copper as gold', () => {
    expect(formatCopper(123456)).toBe('1,234.56 gp')
    expect(formatCopper(5)).toBe('0.05 gp')
    expect(formatCopper(-250)).toBe('-2.50 gp')
  })

  it('splits without losing a single copper', () => {
    const parts = splitCopper(1000, 3)
    expect(parts).toEqual([334, 333, 333])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000)
  })
})
