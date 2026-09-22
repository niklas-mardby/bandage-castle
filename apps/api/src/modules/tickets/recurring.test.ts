import { describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({ prisma: {} }))

import { mondayOf, planWeek } from './recurring'

describe('mondayOf', () => {
  it('finds the Monday of the week', () => {
    expect(mondayOf(new Date('2026-09-24T15:00:00Z')).toISOString().slice(0, 10)).toBe('2026-09-21') // Thursday
    expect(mondayOf(new Date('2026-09-21T08:00:00Z')).toISOString().slice(0, 10)).toBe('2026-09-21') // Monday
  })

  it('treats Sunday as the end of the week', () => {
    expect(mondayOf(new Date('2026-09-27T12:00:00Z')).toISOString().slice(0, 10)).toBe('2026-09-21')
  })
})

describe('planWeek', () => {
  const lairs = [
    { id: 1, name: 'The Ember Vault', wing: 'NORTH_TOWER', isActive: true },
    { id: 2, name: 'Under the Old Bridge', wing: 'DUNGEON', isActive: true },
    { id: 3, name: 'The Leaky Grotto', wing: 'DUNGEON', isActive: false },
    { id: 4, name: 'The Perch', wing: 'ROOFTOP', isActive: true },
  ]
  const plan = planWeek(lairs, new Date('2026-09-21T00:00:00Z'))

  it('plans one clean per open lair', () => {
    expect(plan.map((p) => p.lairName).sort()).toEqual(['The Ember Vault', 'The Perch', 'Under the Old Bridge'])
  })

  it('puts each wing on its rota day', () => {
    const due = Object.fromEntries(plan.map((p) => [p.lairName, p.dueDate.toISOString().slice(0, 10)]))
    expect(due['The Ember Vault']).toBe('2026-09-21')
    expect(due['Under the Old Bridge']).toBe('2026-09-22')
    expect(due['The Perch']).toBe('2026-09-25')
  })
})
