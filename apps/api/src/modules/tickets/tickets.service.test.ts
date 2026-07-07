import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../db/prisma', () => ({
  prisma: {
    ticket: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

import { prisma } from '../../db/prisma'
import { listTickets, setStatus, updateTicket } from './tickets.service'

const db = prisma as unknown as {
  ticket: { [m: string]: ReturnType<typeof vi.fn> }
  auditLog: { create: ReturnType<typeof vi.fn> }
}

const tickets = (ids: number[]) => ids.map((id) => ({ id, title: `Ticket ${id}` }))

beforeEach(() => vi.resetAllMocks())

describe('listTickets', () => {
  it('returns a page and a cursor when there are more', async () => {
    db.ticket.findMany.mockResolvedValue(tickets([30, 29, 28, 27]))
    const page = await listTickets({ take: 3 }, 1)
    expect(page.items.map((t) => t.id)).toEqual([30, 29, 28])
    expect(page.nextCursor).toBe(27)
  })

  it('has no cursor on the last page', async () => {
    db.ticket.findMany.mockResolvedValue(tickets([2, 1]))
    const page = await listTickets({ take: 3 }, 1)
    expect(page.nextCursor).toBeNull()
  })

  it('passes the cursor on to Prisma', async () => {
    db.ticket.findMany.mockResolvedValue([])
    await listTickets({ take: 3, cursor: 27 }, 1)
    expect(db.ticket.findMany.mock.calls[0][0]).toMatchObject({ cursor: { id: 27 }, skip: 1, take: 4 })
  })

  it('filters "assigned to me"', async () => {
    db.ticket.findMany.mockResolvedValue([])
    await listTickets({ take: 20, mine: true }, 42)
    expect(db.ticket.findMany.mock.calls[0][0].where.assigneeId).toBe(42)
  })
})

describe('updateTicket', () => {
  it('writes an audit entry with the changed fields', async () => {
    db.ticket.findUnique.mockResolvedValue({ id: 5, title: 'Moat net', priority: 'LOW' })
    db.ticket.update.mockResolvedValue({ id: 5, title: 'Moat net', priority: 'HIGH' })
    await updateTicket(5, { priority: 'HIGH' }, 7)
    expect(db.auditLog.create).toHaveBeenCalledOnce()
    expect(db.auditLog.create.mock.calls[0][0].data.after).toEqual({ priority: 'HIGH' })
  })
})

describe('setStatus', () => {
  it('closes tickets that are done', async () => {
    db.ticket.findUnique.mockResolvedValue({ id: 5, status: 'OPEN' })
    db.ticket.update.mockImplementation(({ data }) => Promise.resolve({ id: 5, ...data }))
    const t = await setStatus(5, 'DONE')
    expect(t.closedAt).toBeInstanceOf(Date)
  })

  it('reopening clears closedAt', async () => {
    db.ticket.findUnique.mockResolvedValue({ id: 5, status: 'DONE', closedAt: new Date() })
    db.ticket.update.mockImplementation(({ data }) => Promise.resolve({ id: 5, ...data }))
    const t = await setStatus(5, 'OPEN')
    expect(t.closedAt).toBeNull()
  })
})
