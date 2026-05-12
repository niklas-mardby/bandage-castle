import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({
  prisma: {
    customer: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    invoice: { groupBy: vi.fn() },
    raven: { count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

import { prisma } from '../../db/prisma'
import { displayName, listCustomers, updateCustomer } from './customers.service'

type Mocked = { [K: string]: { [M: string]: ReturnType<typeof vi.fn> } }
const db = prisma as unknown as Mocked

beforeEach(() => vi.resetAllMocks())

describe('displayName', () => {
  it('joins title, first and last name', () => {
    expect(displayName({ title: 'Lady', firstName: 'Morwenna', lastName: 'Grimsby' })).toBe('Lady Morwenna Grimsby')
  })

  it('skips missing parts', () => {
    expect(displayName({ title: null, firstName: null, lastName: 'the Unpleasant' })).toBe('the Unpleasant')
  })
})

describe('listCustomers', () => {
  it('adds counts and what each customer owes', async () => {
    db.customer.findMany.mockResolvedValue([
      { id: 1, title: 'Baron', firstName: 'Aldric', lastName: 'Vexmoor', _count: { monsters: 2, stays: 7 } },
      { id: 2, title: null, firstName: 'Grizelda', lastName: 'Hexwort', _count: { monsters: 3, stays: 1 } },
    ])
    db.invoice.groupBy.mockResolvedValue([{ customerId: 1, _sum: { total: '125.50' } }])

    const result = await listCustomers({})

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ name: 'Baron Aldric Vexmoor', monsterCount: 2, stayCount: 7, owedGold: 125.5 })
    expect(result[1].owedGold).toBe(0)
  })

  it('searches by name, email and title', async () => {
    db.customer.findMany.mockResolvedValue([])
    db.invoice.groupBy.mockResolvedValue([])
    await listCustomers({ q: 'grim' })
    const where = db.customer.findMany.mock.calls[0][0].where
    expect(where.OR).toHaveLength(4)
  })

  it('filters customers with a login', async () => {
    db.customer.findMany.mockResolvedValue([])
    db.invoice.groupBy.mockResolvedValue([])
    await listCustomers({ hasLogin: 'yes' })
    expect(db.customer.findMany.mock.calls[0][0].where.userId).toEqual({ not: null })
  })
})

describe('updateCustomer', () => {
  it('audits only what changed', async () => {
    db.customer.findUnique.mockResolvedValue({ id: 3, contactPref: 'raven', email: 'a@b.example' })
    db.customer.update.mockResolvedValue({ id: 3, contactPref: 'email', email: 'a@b.example' })

    await updateCustomer(3, { contactPref: 'email' }, 99)

    const entry = db.auditLog.create.mock.calls[0][0].data
    expect(entry).toMatchObject({ actorId: 99, entity: 'customer', entityId: '3', action: 'UPDATE' })
    expect(entry.before).toEqual({ contactPref: 'raven' })
    expect(entry.after).toEqual({ contactPref: 'email' })
  })

  it('throws for unknown customers', async () => {
    db.customer.findUnique.mockResolvedValue(null)
    await expect(updateCustomer(404, {}, 1)).rejects.toThrow(/not found/)
  })
})
