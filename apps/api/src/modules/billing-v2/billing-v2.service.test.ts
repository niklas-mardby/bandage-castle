import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({
  prisma: {
    invoiceV2: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    invoice: { findUnique: vi.fn() },
    stay: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
    paymentV2: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('../../legacy/ravenPost/ravenPost', () => ({ sendRaven: vi.fn() }))

import { prisma } from '../../db/prisma'
import { createFromStay, getByLegacyId, recordPayment } from './billing-v2.service'

type M = { [k: string]: { [m: string]: ReturnType<typeof vi.fn> } } & { $transaction: ReturnType<typeof vi.fn> }
const db = prisma as unknown as M

beforeEach(() => {
  vi.resetAllMocks()
  db.customer.findUnique.mockResolvedValue({ id: 2, title: 'Lady', firstName: 'Morwenna', lastName: 'Grimsby', lairAddress: 'Crypt', contactPref: 'email', userId: null })
})

const stay = {
  id: 10,
  customerId: 2,
  reason: 'BOARDING',
  status: 'CHECKED_OUT',
  startDate: new Date('2026-03-01'),
  checkedInAt: new Date('2026-03-01T10:00:00'),
  checkedOutAt: new Date('2026-03-05T10:00:00'),
  expectedPickup: new Date('2026-03-05'),
  dailyRate: { toString: () => '12.50' },
}

describe('createFromStay', () => {
  it('refuses stays that are still going', async () => {
    db.stay.findUnique.mockResolvedValue({ ...stay, status: 'CHECKED_IN' })
    await expect(createFromStay(10)).rejects.toThrow(/checked-out/)
  })

  it('refuses to invoice a stay twice', async () => {
    db.stay.findUnique.mockResolvedValue(stay)
    db.invoiceV2.findFirst.mockResolvedValue({ number: 'BC-2026-000001' })
    await expect(createFromStay(10)).rejects.toThrow(/already invoiced/)
  })

  it('creates an issued invoice with lines in copper', async () => {
    db.stay.findUnique.mockResolvedValue(stay)
    db.invoiceV2.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ number: 'BC-2026-000041' })
    db.invoiceV2.create.mockImplementation(({ data }) => Promise.resolve({ ...data, id: 1, payments: [], lines: data.lines.create }))

    const inv = await createFromStay(10)

    expect(inv.number).toBe('BC-2026-000042')
    expect(inv.totalCopper).toBe(4 * 1250)
    expect(inv.balanceCopper).toBe(5000)
    expect(db.notification.create).toHaveBeenCalled()
  })
})

describe('getByLegacyId', () => {
  it('returns the stored copy when the invoice was backfilled', async () => {
    db.invoiceV2.findUnique.mockResolvedValue({ id: 7, customerId: 2, totalCopper: 999, payments: [{ amountCopper: 999 }], lines: [] })
    const inv = await getByLegacyId(3)
    expect(inv.isPreview).toBe(false)
    expect(inv.balanceCopper).toBe(0)
  })

  it('recalculates with the v2 rules when there is no copy', async () => {
    db.invoiceV2.findUnique.mockResolvedValue(null)
    db.invoice.findUnique.mockResolvedValue({ id: 3, customerId: 2, stayId: 10, status: 'UNPAID', issuedAt: new Date(), dueDate: null, stay, payments: [] })
    const inv = await getByLegacyId(3)
    expect(inv.isPreview).toBe(true)
    expect(inv.number).toBe('LEGACY-3')
    expect(inv.lines.map((l) => l.kind)).toEqual(['STAY'])
  })
})

describe('recordPayment', () => {
  it('refuses to take more than is owed', async () => {
    db.invoiceV2.findUnique.mockResolvedValue({ id: 1, status: 'ISSUED', totalCopper: 1000, payments: [{ amountCopper: 600 }] })
    await expect(recordPayment(1, { amountCopper: 500, method: 'GOLD' }, 9)).rejects.toThrow(/outstanding/)
  })

  it('refuses void invoices', async () => {
    db.invoiceV2.findUnique.mockResolvedValue({ id: 1, status: 'VOID', totalCopper: 1000, payments: [] })
    await expect(recordPayment(1, { amountCopper: 100, method: 'GOLD' }, 9)).rejects.toThrow(/void/)
  })

  it('marks the invoice paid when the last copper comes in', async () => {
    db.invoiceV2.findUnique.mockResolvedValue({ id: 1, status: 'ISSUED', totalCopper: 1000, payments: [{ amountCopper: 600 }] })
    const tx = {
      paymentV2: { create: vi.fn() },
      invoiceV2: { update: vi.fn().mockResolvedValue({ id: 1, totalCopper: 1000, payments: [{ amountCopper: 600 }, { amountCopper: 400 }], status: 'PAID' }) },
    }
    db.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx))
    const inv = await recordPayment(1, { amountCopper: 400, method: 'GEMS' }, 9)
    expect(tx.invoiceV2.update.mock.calls[0][0].data.status).toBe('PAID')
    expect(inv.balanceCopper).toBe(0)
  })
})
