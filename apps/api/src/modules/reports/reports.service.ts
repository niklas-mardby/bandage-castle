// Reports v2 (Prisma). The 2022 reports in legacy/reports still exist as "classic reports".
import { prisma } from '../../db/prisma'

const DAY_MS = 24 * 60 * 60 * 1000

function utcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** How many monsters slept in the castle each night between `from` and `to`. */
export async function occupancy(from: Date, to: Date) {
  const stays = await prisma.stay.findMany({
    where: {
      status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      checkedInAt: { lte: to },
      OR: [{ checkedOutAt: null }, { checkedOutAt: { gte: from } }],
    },
    select: { checkedInAt: true, checkedOutAt: true, reason: true },
  })
  const capacity = (await prisma.lair.aggregate({ where: { isActive: true }, _sum: { capacity: true } }))._sum.capacity ?? 0

  const days: { day: string; total: number; byReason: Record<string, number> }[] = []
  for (let t = utcDay(from).getTime(); t <= utcDay(to).getTime(); t += DAY_MS) {
    const night = new Date(t + 20 * 60 * 60 * 1000) // 20:00, when the keepers count heads
    const present = stays.filter((s) => s.checkedInAt && s.checkedInAt <= night && (!s.checkedOutAt || s.checkedOutAt > night))
    const byReason: Record<string, number> = {}
    for (const s of present) byReason[s.reason] = (byReason[s.reason] ?? 0) + 1
    days.push({ day: isoDay(new Date(t)), total: present.length, byReason })
  }
  return { capacity, days }
}

/** Invoiced gold per stay reason (legacy invoices). */
export async function revenueByReason(year: number) {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { not: 'VOID' },
      issuedAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
    },
    select: { total: true, stay: { select: { reason: true } } },
  })
  const totals = new Map<string, { gold: number; invoices: number }>()
  for (const inv of invoices) {
    const reason = inv.stay?.reason ?? 'OTHER'
    const t = totals.get(reason) ?? { gold: 0, invoices: 0 }
    t.gold += Number(inv.total)
    t.invoices++
    totals.set(reason, t)
  }
  return [...totals.entries()].map(([reason, t]) => ({ reason, gold: Math.round(t.gold * 100) / 100, invoices: t.invoices })).sort((a, b) => b.gold - a.gold)
}

export async function staysPerMonth(months: number) {
  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - months + 1, 1))
  const stays = await prisma.stay.findMany({ where: { startDate: { gte: since }, status: { not: 'CANCELLED' } }, select: { startDate: true, reason: true } })
  const rows = new Map<string, Record<string, number>>()
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + i, 1))
    rows.set(d.toISOString().slice(0, 7), {})
  }
  for (const s of stays) {
    if (!s.startDate) continue
    const key = s.startDate.toISOString().slice(0, 7)
    const row = rows.get(key)
    if (row) row[s.reason] = (row[s.reason] ?? 0) + 1
  }
  return [...rows.entries()].map(([month, byReason]) => ({ month, byReason, total: Object.values(byReason).reduce((a, b) => a + b, 0) }))
}

export async function topCustomers(limit: number) {
  const grouped = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: { status: { not: 'VOID' } },
    _sum: { total: true },
    _count: { _all: true },
    orderBy: { _sum: { total: 'desc' } },
    take: limit,
  })
  const customers = await prisma.customer.findMany({
    where: { id: { in: grouped.map((g) => g.customerId) } },
    select: { id: true, title: true, firstName: true, lastName: true },
  })
  return grouped.map((g) => {
    const c = customers.find((x) => x.id === g.customerId)
    return {
      customerId: g.customerId,
      name: c ? [c.title, c.firstName, c.lastName].filter(Boolean).join(' ') : `#${g.customerId}`,
      invoices: g._count._all,
      gold: Math.round(Number(g._sum.total ?? 0) * 100) / 100,
    }
  })
}

export async function averageStay() {
  const stays = await prisma.stay.findMany({
    where: { status: 'CHECKED_OUT', checkedInAt: { not: null }, checkedOutAt: { not: null } },
    select: { reason: true, checkedInAt: true, checkedOutAt: true, expectedPickup: true },
  })
  const by = new Map<string, { nights: number; stays: number; late: number }>()
  for (const s of stays) {
    const nights = Math.max(1, Math.round((s.checkedOutAt!.getTime() - s.checkedInAt!.getTime()) / DAY_MS))
    const row = by.get(s.reason) ?? { nights: 0, stays: 0, late: 0 }
    row.nights += nights
    row.stays++
    if (s.expectedPickup && utcDay(s.checkedOutAt!) > s.expectedPickup) row.late++
    by.set(s.reason, row)
  }
  return [...by.entries()].map(([reason, r]) => ({
    reason,
    stays: r.stays,
    averageNights: Math.round((r.nights / r.stays) * 10) / 10,
    latePickupPercent: Math.round((r.late / r.stays) * 100),
  }))
}

export async function hiring() {
  const [open, contracts] = await Promise.all([
    prisma.hiringListing.count({ where: { status: 'OPEN' } }),
    prisma.hireContract.findMany({ where: { signedAt: { not: null } }, include: { application: { include: { listing: { select: { createdAt: true } } } } } }),
  ])
  const daysToHire = contracts.map((c) => (c.signedAt!.getTime() - c.application.listing.createdAt.getTime()) / DAY_MS)
  const byQuarter = new Map<string, number>()
  for (const c of contracts) {
    const d = c.signedAt!
    const key = `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`
    byQuarter.set(key, (byQuarter.get(key) ?? 0) + 1)
  }
  return {
    openListings: open,
    signedContracts: contracts.length,
    averageDaysToHire: daysToHire.length ? Math.round(daysToHire.reduce((a, b) => a + b, 0) / daysToHire.length) : null,
    feeGoldTotal: Math.round(contracts.reduce((s, c) => s + c.fee, 0) * 100) / 100,
    byQuarter: [...byQuarter.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([quarter, n]) => ({ quarter, contracts: n })),
  }
}

/** Very small CSV writer: arrays of flat objects only. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n') + '\n'
}
