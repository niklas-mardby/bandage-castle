import { addDays } from 'date-fns'
import { prisma } from '../../db/prisma'
import { BadRequestError, NotFoundError } from '../../errors/httpErrors'
import { buildLines, invoiceNumber, totalOf } from './engine'
import { NotificationService } from '../notifications/notification.service'
import { formatGold } from '../../utils/formatGold'

const PAYMENT_TERMS_DAYS = 30

const include = {
  lines: { orderBy: { position: 'asc' } },
  payments: { orderBy: { receivedAt: 'asc' } },
} as const

async function nextNumber(year: number) {
  const prefix = `BC-${year}-`
  const last = await prisma.invoiceV2.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: 'desc' } })
  const seq = last ? Number(last.number.slice(prefix.length)) + 1 : 1
  return invoiceNumber(year, seq)
}

async function customerSummary(customerId: number) {
  return prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, title: true, firstName: true, lastName: true, lairAddress: true },
  })
}

function withPaid<T extends { totalCopper: number; payments: { amountCopper: number }[] }>(invoice: T) {
  const paidCopper = invoice.payments.reduce((s, p) => s + p.amountCopper, 0)
  return { ...invoice, paidCopper, balanceCopper: invoice.totalCopper - paidCopper }
}

export async function listInvoices(filter: { customerId?: number; status?: string } = {}) {
  const invoices = await prisma.invoiceV2.findMany({
    where: { customerId: filter.customerId, status: filter.status },
    include: { payments: true },
    orderBy: { issuedAt: 'desc' },
  })
  return invoices.map(withPaid)
}

export async function getInvoice(id: number) {
  const invoice = await prisma.invoiceV2.findUnique({ where: { id }, include })
  if (!invoice) throw new NotFoundError('Invoice')
  return { ...withPaid(invoice), customer: await customerSummary(invoice.customerId), isPreview: false }
}

/**
 * The v2 view of a legacy invoice. If it has been backfilled we return the
 * stored copy; otherwise we calculate it from the stay with the v2 rules
 * (not saved, `isPreview: true`).
 */
export async function getByLegacyId(legacyId: number) {
  const stored = await prisma.invoiceV2.findUnique({ where: { legacyInvoiceId: legacyId }, include })
  if (stored) return { ...withPaid(stored), customer: await customerSummary(stored.customerId), isPreview: false }

  const legacy = await prisma.invoice.findUnique({ where: { id: legacyId }, include: { stay: true, payments: true } })
  if (!legacy) throw new NotFoundError('Invoice')
  if (!legacy.stay) throw new BadRequestError('This invoice has no stay to recalculate from')

  const lines = buildLines({ ...legacy.stay, dailyRate: legacy.stay.dailyRate?.toString() ?? null })
  const totalCopper = totalOf(lines)
  const payments = legacy.payments.map((p) => ({
    id: p.id,
    invoiceId: legacyId,
    amountCopper: Math.round(Number(p.amount) * 100),
    method: p.method ?? 'GOLD',
    receivedAt: p.paidAt ?? new Date(),
    receivedById: null,
    note: null,
  }))
  return {
    ...withPaid({
      id: -legacy.id,
      legacyInvoiceId: legacy.id,
      stayId: legacy.stayId,
      customerId: legacy.customerId,
      number: `LEGACY-${legacy.id}`,
      status: legacy.status === 'PAID' ? 'PAID' : legacy.status === 'VOID' ? 'VOID' : 'ISSUED',
      issuedAt: legacy.issuedAt,
      dueAt: legacy.dueDate,
      subtotalCopper: totalCopper,
      totalCopper,
      notes: null,
      createdAt: legacy.issuedAt ?? new Date(),
      updatedAt: legacy.issuedAt ?? new Date(),
      lines: lines.map((l, i) => ({ ...l, id: -(i + 1), invoiceId: -legacy.id, position: i })),
      payments,
    }),
    customer: await customerSummary(legacy.customerId),
    isPreview: true,
  }
}

export async function createFromStay(stayId: number) {
  const stay = await prisma.stay.findUnique({ where: { id: stayId } })
  if (!stay) throw new NotFoundError('Stay')
  if (stay.status !== 'CHECKED_OUT') throw new BadRequestError('Only checked-out stays can be invoiced')
  const existing = await prisma.invoiceV2.findFirst({ where: { stayId, status: { not: 'VOID' } } })
  if (existing) throw new BadRequestError(`Stay already invoiced as ${existing.number}`)

  const lines = buildLines({ ...stay, dailyRate: stay.dailyRate?.toString() ?? null })
  const total = totalOf(lines)
  const issuedAt = new Date()

  const invoice = await prisma.invoiceV2.create({
    data: {
      stayId,
      customerId: stay.customerId,
      number: await nextNumber(issuedAt.getFullYear()),
      status: 'ISSUED',
      issuedAt,
      dueAt: addDays(issuedAt, PAYMENT_TERMS_DAYS),
      subtotalCopper: total,
      totalCopper: total,
      lines: { create: lines.map((l, position) => ({ ...l, position })) },
    },
    include,
  })
  await NotificationService.notifyCustomer(
    stay.customerId,
    `Invoice ${invoice.number}`,
    `Your invoice of ${formatGold(total)} is ready. Please pay within ${PAYMENT_TERMS_DAYS} days.`,
  )
  return withPaid(invoice)
}

export async function recordPayment(id: number, input: { amountCopper: number; method: string; note?: string }, staffId: number) {
  const invoice = await prisma.invoiceV2.findUnique({ where: { id }, include: { payments: true } })
  if (!invoice) throw new NotFoundError('Invoice')
  if (invoice.status === 'VOID') throw new BadRequestError('This invoice is void')
  if (invoice.status === 'PAID') throw new BadRequestError('Already paid in full')

  const paid = invoice.payments.reduce((s, p) => s + p.amountCopper, 0)
  const remaining = invoice.totalCopper - paid
  if (input.amountCopper > remaining) throw new BadRequestError(`Only ${formatGold(remaining)} is outstanding`)

  return prisma.$transaction(async (tx) => {
    await tx.paymentV2.create({ data: { invoiceId: id, amountCopper: input.amountCopper, method: input.method, note: input.note, receivedById: staffId } })
    const fullyPaid = input.amountCopper === remaining
    const updated = await tx.invoiceV2.update({ where: { id }, data: { status: fullyPaid ? 'PAID' : invoice.status }, include })
    return withPaid(updated)
  })
}

export async function voidInvoice(id: number) {
  const invoice = await prisma.invoiceV2.findUnique({ where: { id } })
  if (!invoice) throw new NotFoundError('Invoice')
  return prisma.invoiceV2.update({ where: { id }, data: { status: 'VOID' } })
}
