import { describe, expect, it } from 'vitest'
import { formatShortDate, timeAgo, userName } from './format'

describe('formatShortDate', () => {
  it('formats as dd/mm/yyyy', () => {
    expect(formatShortDate('2026-01-05T12:00:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('pads single digits', () => {
    expect(formatShortDate('2026-03-07T12:00:00Z').startsWith('07/')).toBe(true)
  })

  it('is empty for missing dates', () => {
    expect(formatShortDate(null)).toBe('')
    expect(formatShortDate(undefined)).toBe('')
  })
})

describe('timeAgo', () => {
  it('says "just now" for very recent things', () => {
    expect(timeAgo(new Date())).toBe('just now')
  })

  it('counts days', () => {
    expect(timeAgo(new Date(Date.now() - 3 * 24 * 3600 * 1000))).toBe('3 days ago')
  })

  it('handles the future', () => {
    expect(timeAgo(new Date(Date.now() + 2 * 3600 * 1000 + 1000))).toBe('in 2 hours')
  })
})

describe('userName', () => {
  it('prefers the display name', () => {
    expect(userName({ displayName: 'Old Hobb', email: 'keeper@bandage.castle' })).toBe('Old Hobb')
  })

  it('falls back to email, then nobody', () => {
    expect(userName({ displayName: null, email: 'keeper@bandage.castle' })).toBe('keeper@bandage.castle')
    expect(userName(null)).toBe('nobody')
  })
})
