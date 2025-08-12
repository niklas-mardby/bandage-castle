// Numbers for the role dashboards. Each function is one dashboard section.
import { prisma } from '../../db/prisma'
import { scheduleFor } from '../feeding/feeding.service'
import { lowStock } from '../supplies/supplies.service'
import { listPlans } from '../therapy/therapy.service'

function startOfToday() {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000)
}

export async function frontDesk() {
  const today = startOfToday()
  const tomorrow = addDays(today, 1)
  const [arrivals, departures, pendingApplications, unpaid, overdue] = await Promise.all([
    prisma.stay.findMany({
      where: { status: 'BOOKED', startDate: { lte: tomorrow } },
      include: { monster: { select: { id: true, name: true } } },
      orderBy: { startDate: 'asc' },
    }),
    prisma.stay.findMany({
      where: { status: 'CHECKED_IN', expectedPickup: { lte: tomorrow } },
      include: { monster: { select: { id: true, name: true } } },
      orderBy: { expectedPickup: 'asc' },
    }),
    prisma.hiringApplication.count({ where: { status: 'PENDING' } }),
    prisma.invoice.count({ where: { status: 'UNPAID' } }),
    prisma.invoice.count({ where: { status: 'UNPAID', dueDate: { lt: today } } }),
  ])
  return {
    arrivals: arrivals.map((s) => ({ stayId: s.id, monster: s.monster, reason: s.reason, startDate: s.startDate })),
    departures: departures.map((s) => ({ stayId: s.id, monster: s.monster, expectedPickup: s.expectedPickup })),
    pendingApplications,
    unpaidInvoices: unpaid,
    overdueInvoices: overdue,
  }
}

export async function admin() {
  const [inResidence, lairs, awaitingHire, openTickets, urgentTickets, low] = await Promise.all([
    prisma.monster.count({ where: { status: 'IN_RESIDENCE' } }),
    prisma.lair.aggregate({ where: { isActive: true }, _sum: { capacity: true } }),
    prisma.monster.count({ where: { status: 'AVAILABLE' } }),
    prisma.ticket.count({ where: { status: { not: 'DONE' } } }),
    prisma.ticket.count({ where: { status: { not: 'DONE' }, priority: 'URGENT' } }),
    lowStock(),
  ])

  // revenue per month for the last 12 months (legacy invoices; v2 isn't switched on yet)
  const since = addDays(startOfToday(), -365)
  const invoices = await prisma.invoice.findMany({ where: { issuedAt: { gte: since }, status: { not: 'VOID' } }, select: { issuedAt: true, total: true } })
  const byMonth = new Map<string, number>()
  for (const inv of invoices) {
    if (!inv.issuedAt) continue
    const key = inv.issuedAt.toISOString().slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(inv.total))
  }
  const revenue = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, gold]) => ({ month, gold: Math.round(gold * 100) / 100 }))

  return {
    occupancy: { inResidence, capacity: lairs._sum.capacity ?? 0 },
    awaitingHire,
    openTickets,
    urgentTickets,
    lowStock: low.map((s) => ({ id: s.id, name: s.name, quantity: s.quantity, unit: s.unit })),
    revenue,
  }
}

export async function keeper(userId: number) {
  const [schedule, myTickets, lairs, low] = await Promise.all([
    scheduleFor(),
    prisma.ticket.findMany({ where: { assigneeId: userId, status: { not: 'DONE' } }, orderBy: [{ priority: 'desc' }, { id: 'desc' }], take: 8 }),
    prisma.lair.findMany({ where: { isActive: true }, include: { _count: { select: { assignments: { where: { releasedAt: null } } } } } }),
    lowStock(),
  ])
  return {
    feeding: { total: schedule.entries.length, done: schedule.entries.filter((e) => e.fed).length },
    myTickets: myTickets.map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status })),
    fullLairs: lairs.filter((l) => l._count.assignments >= l.capacity).map((l) => ({ id: l.id, name: l.name })),
    lowStock: low.length,
  }
}

export async function vet() {
  const today = startOfToday()
  const [ongoing, prescriptions, inForTreatment] = await Promise.all([
    prisma.treatment.count({ where: { status: 'ONGOING' } }),
    prisma.prescription.count({ where: { startDate: { lte: today }, OR: [{ endDate: null }, { endDate: { gte: today } }] } }),
    prisma.stay.count({ where: { status: 'CHECKED_IN', reason: 'TREATMENT' } }),
  ])
  return { ongoingTreatments: ongoing, activePrescriptions: prescriptions, inForTreatment }
}

export async function therapist(userId: number) {
  const plans = await listPlans({ status: 'ACTIVE', therapistId: userId })
  const today = startOfToday()
  const due = plans.filter((p) => p.nextSessionDate && p.nextSessionDate <= addDays(today, 1))
  return {
    activePlans: plans.length,
    sessionsDue: due.map((p) => ({ planId: p.id, monster: p.monster.name, issue: p.issue })),
  }
}

export async function scribe() {
  const [drafts, latest] = await Promise.all([
    prisma.bulletinPage.findMany({ where: { status: 'DRAFT' }, select: { id: true, title: true, slug: true }, orderBy: { updatedAt: 'desc' } }),
    prisma.bulletinPage.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true, slug: true, kind: true, publishedAt: true }, orderBy: { publishedAt: 'desc' }, take: 5 }),
  ])
  return { drafts, latest }
}

/** For owners and overlords. */
export async function customer(customerId: number | null) {
  if (!customerId) return { monsters: [], unpaidInvoices: [], applications: [] }
  const [monsters, invoices, applications] = await Promise.all([
    prisma.monster.findMany({
      where: { ownerId: customerId },
      select: {
        id: true,
        name: true,
        status: true,
        species: { select: { name: true } },
        stays: { where: { status: { in: ['BOOKED', 'CHECKED_IN'] } }, select: { id: true, status: true, reason: true, expectedPickup: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.invoice.findMany({ where: { customerId, status: 'UNPAID' }, select: { id: true, total: true, dueDate: true }, orderBy: { dueDate: 'asc' } }),
    prisma.hiringApplication.findMany({
      where: { customerId },
      include: { listing: { select: { id: true, monster: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])
  return {
    monsters,
    unpaidInvoices: invoices.map((i) => ({ ...i, total: Number(i.total) })),
    applications: applications.map((a) => ({ id: a.id, status: a.status, listingId: a.listing.id, monster: a.listing.monster.name })),
  }
}
