import { describe, expect, it } from 'vitest'
import { nextSessionDate, progressOf } from './progress'

const s = (date: string, moodBefore: number, moodAfter: number) => ({ sessionDate: new Date(date), moodBefore, moodAfter })

describe('progressOf', () => {
  it('is unknown without sessions', () => {
    expect(progressOf([])).toEqual({ sessions: 0, averageLift: null, trend: 'unknown', latestMood: null })
  })

  it('sees improvement over time', () => {
    const p = progressOf([s('2025-04-01', 2, 4), s('2025-04-08', 3, 5), s('2025-04-15', 5, 7)])
    expect(p.trend).toBe('improving')
    expect(p.averageLift).toBe(2)
    expect(p.latestMood).toBe(7)
  })

  it('does not care about input order', () => {
    const p = progressOf([s('2025-04-15', 5, 7), s('2025-04-01', 2, 4)])
    expect(p.trend).toBe('improving')
  })

  it('notices when things get worse', () => {
    expect(progressOf([s('2025-04-01', 7, 7), s('2025-04-08', 4, 5)]).trend).toBe('worse')
  })
})

describe('nextSessionDate', () => {
  it('is a week after a normal session', () => {
    const next = nextSessionDate(s('2025-04-01', 5, 6), new Date('2025-04-02'))
    expect(next.toISOString().slice(0, 10)).toBe('2025-04-08')
  })

  it('is sooner after a bad session', () => {
    const next = nextSessionDate(s('2025-04-01', 3, 2), new Date('2025-04-02'))
    expect(next.toISOString().slice(0, 10)).toBe('2025-04-04')
  })

  it('is never in the past', () => {
    const today = new Date('2025-05-01')
    expect(nextSessionDate(s('2025-04-01', 5, 6), today)).toEqual(today)
  })
})
