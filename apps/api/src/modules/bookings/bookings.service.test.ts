import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({
  prisma: {
    monster: { findUnique: vi.fn(), findMany: vi.fn() },
    stay: { findFirst: vi.fn() },
    bookingRequest: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    customer: { findUnique: vi.fn(), findMany: vi.fn() },
    userRole: { findMany: vi.fn() },
    notification: { create: vi.fn(), createMany: vi.fn() },
    setting: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('../../legacy/ravenPost/ravenPost', () => ({ sendRaven: vi.fn() }))

import { prisma } from '../../db/prisma'
import { cancelRequest, createRequest, declineRequest, requestSchema } from './bookings.service'

type M = { [k: string]: { [m: string]: ReturnType<typeof vi.fn> } }
const db = prisma as unknown as M

const input = { monsterId: 5, reason: 'BOARDING' as const, startDate: '2026-11-10', endDate: '2026-11-20' }

beforeEach(() => {
  vi.resetAllMocks()
  db.userRole.findMany.mockResolvedValue([])
})

describe('requestSchema', () => {
  it('needs the pickup after the arrival', () => {
    expect(requestSchema.safeParse({ ...input, endDate: '2026-11-01' }).success).toBe(false)
  })

  it('does not allow surrenders by request', () => {
    expect(requestSchema.safeParse({ ...input, reason: 'SURRENDER' }).success).toBe(false)
  })
})

describe('createRequest', () => {
  it('only lets owners book their own monsters', async () => {
    db.monster.findUnique.mockResolvedValue({ id: 5, name: 'Basil', ownerId: 99 })
    await expect(createRequest(1, input, 10)).rejects.toThrow(/your own monsters/)
  })

  it('refuses monsters that already have a booking', async () => {
    db.monster.findUnique.mockResolvedValue({ id: 5, name: 'Basil', ownerId: 1 })
    db.stay.findFirst.mockResolvedValue({ id: 3 })
    await expect(createRequest(1, input, 10)).rejects.toThrow(/already has a booking/)
  })

  it('creates a pending request and tells the front desk', async () => {
    db.monster.findUnique.mockResolvedValue({ id: 5, name: 'Basil', ownerId: 1 })
    db.stay.findFirst.mockResolvedValue(null)
    db.bookingRequest.create.mockResolvedValue({ id: 8, status: 'PENDING' })
    db.customer.findUnique.mockResolvedValue({ id: 1, email: 'malgrim@doomspire.example' })
    const r = await createRequest(1, input, 10)
    expect(r.status).toBe('PENDING')
    expect(db.userRole.findMany).toHaveBeenCalled()
  })

  it('needs a customer profile', async () => {
    await expect(createRequest(null, input, 10)).rejects.toThrow(/customer profile/)
  })
})

describe('declineRequest and cancelRequest', () => {
  it('declines pending requests with a note', async () => {
    db.bookingRequest.findUnique.mockResolvedValue({ id: 8, status: 'PENDING', customerId: 1 })
    db.bookingRequest.update.mockResolvedValue({ id: 8, status: 'DECLINED' })
    db.customer.findUnique.mockResolvedValue({ id: 1, contactPref: 'email', userId: null })
    await declineRequest(8, 'Fully booked', 3)
    expect(db.bookingRequest.update.mock.calls[0][0].data).toMatchObject({ status: 'DECLINED', declineNote: 'Fully booked' })
  })

  it('will not decline twice', async () => {
    db.bookingRequest.findUnique.mockResolvedValue({ id: 8, status: 'APPROVED' })
    await expect(declineRequest(8, 'nope', 3)).rejects.toThrow(/already handled/)
  })

  it('owners can only cancel their own requests', async () => {
    db.bookingRequest.findUnique.mockResolvedValue({ id: 8, status: 'PENDING', customerId: 2 })
    await expect(cancelRequest(8, 1)).rejects.toThrow(/not found/)
  })
})
