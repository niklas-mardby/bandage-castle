import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({
  prisma: {
    lair: { findUnique: vi.fn() },
    monster: { findUnique: vi.fn() },
    lairAssignment: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    speciesCompatibility: { findMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { prisma } from '../../db/prisma'
import { assignMonster, findConflicts } from './lairs.service'

const db = prisma as unknown as {
  lair: { findUnique: ReturnType<typeof vi.fn> }
  monster: { findUnique: ReturnType<typeof vi.fn> }
  lairAssignment: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }
  speciesCompatibility: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

const BASILISK = 4
const COCKATRICE = 7

beforeEach(() => {
  vi.resetAllMocks()
})

describe('findConflicts', () => {
  it('returns nothing for an empty lair', async () => {
    db.lairAssignment.findMany.mockResolvedValue([])
    expect(await findConflicts(1, BASILISK)).toEqual([])
    expect(db.speciesCompatibility.findMany).not.toHaveBeenCalled()
  })

  it('blocks a basilisk from moving in next to a cockatrice', async () => {
    db.lairAssignment.findMany.mockResolvedValue([{ monster: { speciesId: COCKATRICE } }])
    db.speciesCompatibility.findMany.mockResolvedValue([{ reason: 'Mutual petrification', incompatibleSpecies: { name: 'Cockatrice' } }])

    const conflicts = await findConflicts(1, BASILISK)

    expect(conflicts).toEqual([{ residentSpecies: 'Cockatrice', reason: 'Mutual petrification' }])
  })

  it('also blocks a cockatrice from moving in next to a basilisk', () => {
    db.lairAssignment.findMany.mockResolvedValue([{ monster: { speciesId: BASILISK } }])
    db.speciesCompatibility.findMany.mockResolvedValue([])

    expect(findConflicts(1, COCKATRICE)).toBeTruthy()
  })
})

describe('assignMonster', () => {
  it('refuses when the lair is full', async () => {
    db.lair.findUnique.mockResolvedValue({ id: 1, name: 'The Ember Vault', capacity: 2, isActive: true })
    db.monster.findUnique.mockResolvedValue({ id: 10, name: 'Sir Snortlewick', species: null })
    db.lairAssignment.count.mockResolvedValue(2)

    await expect(assignMonster(1, { monsterId: 10 }, 99)).rejects.toThrow(/full/)
  })

  it('refuses closed lairs', async () => {
    db.lair.findUnique.mockResolvedValue({ id: 1, name: 'The Leaky Grotto', capacity: 2, isActive: false })

    await expect(assignMonster(1, { monsterId: 10 }, 99)).rejects.toThrow(/closed/)
  })

  it('moves the monster in', async () => {
    db.lair.findUnique.mockResolvedValue({ id: 1, name: 'The Ember Vault', capacity: 2, isActive: true })
    db.monster.findUnique.mockResolvedValue({ id: 10, name: 'Sir Snortlewick', species: null })
    db.lairAssignment.count.mockResolvedValue(1)
    db.$transaction.mockResolvedValue([{ count: 0 }, { id: 55 }])

    expect(await assignMonster(1, { monsterId: 10 }, 99)).toEqual({ assignmentId: 55, warnings: [] })
  })
})
