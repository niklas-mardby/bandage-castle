import { describe, expect, it } from 'vitest'
import { formatDateTime, formatDay } from './dates'

describe('formatDay', () => {
  it('formats a date-only string', () => {
    expect(formatDay('2026-03-15')).toBe('15 Mar 2026')
  })

  it('accepts Date objects', () => {
    expect(formatDay(new Date(2026, 9, 31))).toBe('31 Oct 2026')
  })

  it('shows a dash for missing dates', () => {
    expect(formatDay(null)).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('includes hours and minutes', () => {
    expect(formatDateTime(new Date(2026, 9, 31, 21, 5))).toBe('31 Oct 2026, 21:05')
  })
})
