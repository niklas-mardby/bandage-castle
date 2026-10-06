import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({
  prisma: {
    hiringListing: { findUnique: vi.fn() },
    hiringApplication: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    hireContract: { create: vi.fn() },
    userRole: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('../../legacy/ravenPost/ravenPost', () => ({ sendRaven: vi.fn() }))

import { prisma } from '../../db/prisma'
import { sendRaven } from '../../legacy/ravenPost/ravenPost'
import { apply, decide, withdraw } from './applications.service'

type M = { [k: string]: { [m: string]: ReturnType<typeof vi.fn> } } & { $transaction: ReturnType<typeof vi.fn> }
const db = prisma as unknown as M

beforeEach(() => vi.resetAllMocks())

const application = {
  id: 4,
  listingId: 2,
  customerId: 7,
  status: 'PENDING',
  listing: { monsterId: 11, feeGold: '400.00', availableFrom: new Date('2026-01-01'), monster: { id: 11, name: 'Grumbold' } },
}

describe('apply', () => {
  it('refuses closed listings', async () => {
    db.hiringListing.findUnique.mockResolvedValue({ id: 2, status: 'CLOSED' })
    await expect(apply(2, 7, { message: 'x'.repeat(30), references: [] })).rejects.toThrow(/not found/)
  })

  it('refuses a second pending application', async () => {
    db.hiringListing.findUnique.mockResolvedValue({ id: 2, status: 'OPEN' })
    db.hiringApplication.findFirst.mockResolvedValue({ id: 1 })
    await expect(apply(2, 7, { message: 'x'.repeat(30), references: [] })).rejects.toThrow(/already applied/)
  })
})

describe('decide', () => {
  it('drafts a contract and rejects the other applicants when accepting', async () => {
    db.hiringApplication.findUnique.mockResolvedValue(application)
    const tx = {
      hiringApplication: { update: vi.fn().mockResolvedValue({ ...application, status: 'ACCEPTED' }), updateMany: vi.fn() },
      hireContract: { create: vi.fn() },
    }
    db.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx))

    await decide(4, 'ACCEPTED', 1)

    expect(tx.hiringApplication.updateMany.mock.calls[0][0].where).toMatchObject({ listingId: 2, status: 'PENDING' })
    const contract = tx.hireContract.create.mock.calls[0][0].data
    expect(contract.reference).toMatch(/^HH-/)
    expect(contract.fee).toBe(400)
    expect(sendRaven).toHaveBeenCalledWith(7, expect.stringContaining('Good news'), expect.any(String))
  })

  it('does not draft a contract when rejecting', async () => {
    db.hiringApplication.findUnique.mockResolvedValue(application)
    const tx = { hiringApplication: { update: vi.fn().mockResolvedValue({ ...application, status: 'REJECTED' }), updateMany: vi.fn() }, hireContract: { create: vi.fn() } }
    db.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx))
    await decide(4, 'REJECTED', 1)
    expect(tx.hireContract.create).not.toHaveBeenCalled()
  })

  it('cannot decide twice', async () => {
    db.hiringApplication.findUnique.mockResolvedValue({ ...application, status: 'ACCEPTED' })
    await expect(decide(4, 'REJECTED', 1)).rejects.toThrow(/Already decided/)
  })
})

describe('withdraw', () => {
  it('only the applicant can withdraw', async () => {
    db.hiringApplication.findUnique.mockResolvedValue(application)
    await expect(withdraw(4, 8)).rejects.toThrow()
  })
})
