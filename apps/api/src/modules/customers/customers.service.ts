// Customers on Prisma (2026). Replaces legacy/customers.
import type { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'
import * as audit from '../audit/audit.service'
import type { CustomerInput } from './customers.schema'

export function displayName(c: { title: string | null; firstName: string | null; lastName: string | null }) {
  return [c.title, c.firstName, c.lastName].filter(Boolean).join(' ')
}

export async function listCustomers(filter: { q?: string; hasLogin?: 'yes' | 'no' }) {
  const where: Prisma.CustomerWhereInput = {}
  if (filter.q) {
    where.OR = [{ firstName: { contains: filter.q } }, { lastName: { contains: filter.q } }, { email: { contains: filter.q } }, { title: { contains: filter.q } }]
  }
  if (filter.hasLogin === 'yes') where.userId = { not: null }
  if (filter.hasLogin === 'no') where.userId = null

  const customers = await prisma.customer.findMany({
    where,
    include: { _count: { select: { monsters: true, stays: true } } },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })
  const unpaid = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: { status: 'UNPAID', customerId: { in: customers.map((c) => c.id) } },
    _sum: { total: true },
  })
  const owed = new Map(unpaid.map((u) => [u.customerId, Number(u._sum.total ?? 0)]))
  return customers.map(({ _count, ...c }) => ({
    ...c,
    name: displayName(c),
    monsterCount: _count.monsters,
    stayCount: _count.stays,
    owedGold: owed.get(c.id) ?? 0,
  }))
}

export async function getCustomer(id: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true } },
      monsters: { select: { id: true, name: true, status: true, species: { select: { name: true } } }, orderBy: { name: 'asc' } },
      stays: {
        select: { id: true, reason: true, status: true, startDate: true, expectedPickup: true, monster: { select: { id: true, name: true } } },
        orderBy: { startDate: 'desc' },
        take: 25,
      },
      invoices: { select: { id: true, total: true, status: true, issuedAt: true, dueDate: true }, orderBy: { issuedAt: 'desc' }, take: 25 },
    },
  })
  if (!customer) throw new NotFoundError('Customer')
  const ravens = await prisma.raven.count({ where: { customerId: id } })
  return {
    ...customer,
    name: displayName(customer),
    invoices: customer.invoices.map((i) => ({ ...i, total: Number(i.total) })),
    ravensSent: ravens,
  }
}

export async function getCustomerByUser(userId: number) {
  const customer = await prisma.customer.findUnique({ where: { userId } })
  if (!customer) throw new NotFoundError('Customer profile')
  return { ...customer, name: displayName(customer) }
}

export async function createCustomer(input: CustomerInput, actorId: number) {
  const customer = await prisma.customer.create({ data: input })
  await audit.record({ actorId, entity: 'customer', entityId: customer.id, action: 'CREATE', after: customer })
  return customer
}

export async function updateCustomer(id: number, input: Partial<CustomerInput>, actorId: number) {
  const before = await prisma.customer.findUnique({ where: { id } })
  if (!before) throw new NotFoundError('Customer')
  const after = await prisma.customer.update({ where: { id }, data: input })
  await audit.record({ actorId, entity: 'customer', entityId: id, action: 'UPDATE', ...audit.diff(before, after) })
  return after
}
