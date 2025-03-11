// Four years of stays, plus everything that hangs off them:
// invoices (old and v2), payments, intake forms, extensions, lair assignments.
import type { PrismaClient } from '@prisma/client'
import { at, day, daysBetween, TODAY, type Rng } from './random'
import type { SeedLair, SeedMonster, World } from './world'

type Reason = 'BOARDING' | 'TREATMENT' | 'THERAPY' | 'SURRENDER'
type Status = 'BOOKED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'

export type PlannedStay = {
  monster: SeedMonster
  customerId: number
  reason: Reason
  status: Status
  start: number // day offset
  pickup: number | null // day offset
  checkout: number | null // day offset of actual check-out
  rate: number // gold
  notes?: string
}

export type SeededStay = PlannedStay & { id: number }

// Some of the original 2022 prices were... oddly specific.
const RATES = [8, 10, 10, 12, 12.5, 15, 20, 25, 4.35, 8.15, 12.45, 16.35, 33.33, 6.95]

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start <= b.end && b.start <= a.end
}

export function planStays(world: World, rng: Rng): PlannedStay[] {
  const plans: PlannedStay[] = []
  const busy = new Map<number, { start: number; end: number }[]>()
  const reserve = (m: SeedMonster, start: number, end: number) => {
    const list = busy.get(m.id) ?? []
    if (list.some((r) => overlaps(r, { start: start - 1, end: end + 1 }))) return false
    list.push({ start, end })
    busy.set(m.id, list)
    return true
  }
  const add = (p: PlannedStay) => {
    const end = p.checkout ?? p.pickup ?? p.start + 30
    if (reserve(p.monster, p.start, end)) plans.push(p)
  }

  const m = world.monsterByKey
  const c = world.customerByKey
  const house = world.houseCustomerId

  // --- the stories everyone knows ------------------------------------------
  add({ monster: m.snortlewick, customerId: c.morwenna.id, reason: 'BOARDING', status: 'CHECKED_IN', start: -6, pickup: 8, checkout: null, rate: 25, notes: 'Lady Grimsby is at a necromancers\' convention. NO SWORDS in his line of sight.' })
  add({ monster: m.fangsworth, customerId: c.morwenna.id, reason: 'BOARDING', status: 'CHECKED_IN', start: -6, pickup: 8, checkout: null, rate: 12 })
  add({ monster: m.mumbles, customerId: c.grizelda.id, reason: 'THERAPY', status: 'CHECKED_IN', start: -20, pickup: 10, checkout: null, rate: 15, notes: 'Bridge trauma programme, week 3.' })
  add({ monster: m.hester, customerId: c.vexmoor.id, reason: 'TREATMENT', status: 'CHECKED_IN', start: -3, pickup: 4, checkout: null, rate: 30, notes: 'Head #3 (Clementine) bitten by head #5 (Eunice). Arrived with FIVE heads.' })
  add({ monster: m.pebble, customerId: c.grizelda.id, reason: 'TREATMENT', status: 'CHECKED_IN', start: -1, pickup: 12, checkout: null, rate: 8, notes: 'Chipped left wing. Fell off Thornwood chapel in the storm.' })
  add({ monster: m.basil, customerId: c.malgrim.id, reason: 'BOARDING', status: 'CHECKED_IN', start: -40, pickup: 30, checkout: null, rate: 20, notes: 'Doomspire renovation. Feed from behind the mirror.' })
  add({ monster: m.nibbles, customerId: c.vexmoor.id, reason: 'THERAPY', status: 'CHECKED_IN', start: -9, pickup: 19, checkout: null, rate: 6.95, notes: 'Fear of torchlight. Start with one candle.' })
  add({ monster: m.gloopert, customerId: c.vexilla.id, reason: 'BOARDING', status: 'BOOKED', start: 3, pickup: 17, checkout: null, rate: 8.15 })
  add({ monster: m.clucky, customerId: house, reason: 'SURRENDER', status: 'CHECKED_IN', start: -2, pickup: null, checkout: null, rate: 10, notes: 'Surrendered after the tax collector incident. Needs a lair!' })
  add({ monster: m.bramble, customerId: house, reason: 'TREATMENT', status: 'CHECKED_IN', start: -5, pickup: 9, checkout: null, rate: 10, notes: 'Lost flight feathers. Listed in the Hiring Hall from when she is better.' })
  // last year's winter boarding: collected exactly on the agreed day
  add({ monster: m.snortlewick, customerId: c.morwenna.id, reason: 'BOARDING', status: 'CHECKED_OUT', start: -320, pickup: -306, checkout: -306, rate: 25, notes: 'Winter boarding.' })
  add({ monster: m.mumbles, customerId: c.grizelda.id, reason: 'BOARDING', status: 'CHECKED_OUT', start: -400, pickup: -390, checkout: -388, rate: 15 })
  add({ monster: m.hester, customerId: c.vexmoor.id, reason: 'TREATMENT', status: 'CHECKED_OUT', start: -190, pickup: -180, checkout: -180, rate: 30, notes: 'Two new heads after an encounter with a hero. Removed nothing, counted twice.' })
  add({ monster: m.grumbold, customerId: house, reason: 'SURRENDER', status: 'CHECKED_OUT', start: -700, pickup: null, checkout: -700, rate: 0 })
  add({ monster: m.whisper, customerId: house, reason: 'SURRENDER', status: 'CHECKED_OUT', start: -1450, pickup: null, checkout: -1450, rate: 0, notes: 'Came with the castle.' })

  // --- castle monsters arrived by surrender at some point ------------------
  for (const monster of world.monsters.filter((x) => x.ownerId === null && !x.key)) {
    const start = rng.int(-1400, -30)
    add({ monster, customerId: rng.pick(world.customers).id, reason: 'SURRENDER', status: 'CHECKED_OUT', start, pickup: null, checkout: start, rate: 0 })
  }

  // --- everything else -------------------------------------------------------
  const owned = world.monsters.filter((x) => x.ownerId !== null && !x.key)
  let guard = 0
  while (plans.length < 300 && guard++ < 5000) {
    const monster = rng.pick(owned)
    const reason = rng.weighted([['BOARDING', 60], ['TREATMENT', 25], ['THERAPY', 15]] as const)
    const nights = reason === 'THERAPY' ? rng.int(14, 35) : reason === 'TREATMENT' ? rng.int(3, 14) : rng.int(3, 21)
    const rate = rng.pick(RATES)
    const kind = rng.weighted([['past', 82], ['current', 9], ['future', 6], ['cancelled', 3]] as const)

    if (kind === 'past') {
      const start = rng.int(-1430, -nights - 3)
      const pickup = start + nights
      const delta = rng.weighted([[-2, 8], [-1, 20], [0, 34], [1, 18], [2, 10], [3, 6], [6, 3], [12, 1]] as const)
      const checkout = Math.min(pickup + delta, -1)
      add({ monster, customerId: monster.ownerId!, reason, status: 'CHECKED_OUT', start, pickup, checkout: Math.max(checkout, start + 1), rate })
    } else if (kind === 'current') {
      const start = rng.int(-Math.min(nights - 1, 20), -1)
      add({ monster, customerId: monster.ownerId!, reason, status: 'CHECKED_IN', start, pickup: start + nights, checkout: null, rate })
    } else if (kind === 'future') {
      const start = rng.int(1, 45)
      add({ monster, customerId: monster.ownerId!, reason, status: 'BOOKED', start, pickup: start + nights, checkout: null, rate })
    } else {
      const start = rng.int(-900, 20)
      add({ monster, customerId: monster.ownerId!, reason, status: 'CANCELLED', start, pickup: start + nights, checkout: null, rate })
    }
  }

  return plans.sort((a, b) => a.start - b.start)
}

// --- legacy (2022) billing rules, copied so the seed matches what the app produced ---

function legacyNights(startDay: number, endDay: number) {
  return Math.max(1, endDay - startDay)
}

function legacyLateDays(pickup: number | null, checkout: number) {
  if (pickup === null) return 0
  if (checkout < pickup) return 0
  return checkout - pickup + 1
}

const round2 = (n: number) => Math.round(n * 100) / 100

export async function seedStays(prisma: PrismaClient, rng: Rng, world: World) {
  const plans = planStays(world, rng)
  const seeded: SeededStay[] = []
  const frontDesk = [world.users.frontdesk.id, world.users.igor.id, world.users.admin.id]

  for (const p of plans) {
    const checkedInAt = p.status === 'CHECKED_IN' || p.status === 'CHECKED_OUT' ? at(p.start, rng.int(8, 16), rng.int(0, 59)) : null
    const checkedOutAt = p.status === 'CHECKED_OUT' && p.checkout !== null ? at(p.checkout, rng.int(9, 18), rng.int(0, 59)) : null
    const stay = await prisma.stay.create({
      data: {
        monsterId: p.monster.id,
        customerId: p.customerId,
        reason: p.reason,
        status: p.status,
        startDate: day(p.start),
        expectedPickup: p.pickup === null ? null : day(p.pickup),
        checkedInAt,
        checkedOutAt,
        dailyRate: p.rate,
        notes: p.notes ?? null,
      },
    })
    seeded.push({ ...p, id: stay.id })

    // intake forms exist since May 2023
    const intakeLaunched = new Date('2023-05-02')
    if (checkedInAt && checkedInAt > intakeLaunched && p.reason !== 'SURRENDER') {
      await prisma.intakeForm.create({
        data: {
          stayId: stay.id,
          monsterId: p.monster.id,
          conditionOnArrival: p.reason === 'TREATMENT' ? rng.pick(['FAIR', 'POOR', 'POOR', 'CRITICAL']) : rng.pick(['EXCELLENT', 'GOOD', 'GOOD', 'FAIR']),
          weightKg: Math.round(Number(p.monster.species.portionKg) * rng.int(8, 30) * 10) / 10 || null,
          injuries:
            p.reason === 'TREATMENT'
              ? rng.pick(['Arrow in the left wing', 'Singed tail', 'Sprained claw from a dramatic exit', 'Sword nick on the snout', 'Bitten by own head', 'Sore throat from roaring', 'Chipped horn'])
              : null,
          behaviourNotes: rng.chance(0.4) ? rng.pick(['Hid under the desk for an hour', 'Very calm', 'Tried to eat the intake form', 'Sang the whole time', 'Asked for the owner every five minutes']) : null,
          belongings: rng.chance(0.3) ? rng.pick(['One golden goblet (do NOT let him hoard it)', 'Favourite blanket', 'A small treasure chest (empty, apparently)', 'Three pebbles named Gary']) : null,
          receivedById: rng.pick(frontDesk),
          createdAt: checkedInAt,
        },
      })
    }

    // extensions (feature since Aug 2023)
    if (p.pickup !== null && p.status !== 'CANCELLED' && day(p.start) > new Date('2023-08-02') && rng.chance(0.08)) {
      const extra = rng.int(2, 7)
      await prisma.stayExtension.create({
        data: {
          stayId: stay.id,
          oldPickup: day(p.pickup - extra),
          newPickup: day(p.pickup),
          reason: rng.pick(['Owner delayed by a siege', 'Owner\'s new lair not ready', 'Vet recommends more rest', 'Owner "forgot"', 'Storm over the pass']),
          createdById: world.users.frontdesk.id,
          createdAt: at(p.start + 1, 10),
        },
      })
    }

    // old-style invoice for every check-out
    if (p.status === 'CHECKED_OUT' && p.checkout !== null && checkedOutAt) {
      await seedLegacyInvoice(prisma, rng, p, stay.id, checkedOutAt)
    }
  }

  return seeded
}

async function seedLegacyInvoice(prisma: PrismaClient, rng: Rng, p: PlannedStay, stayId: number, issuedAt: Date) {
  const nights = legacyNights(p.start, p.checkout!)
  const lines: { description: string; qty: number; unitPrice: number; amount: number; kind: string }[] = []
  lines.push({ description: `${nights} nights (${p.reason.toLowerCase()})`, qty: nights, unitPrice: p.rate, amount: nights * p.rate, kind: 'STAY' })
  const late = legacyLateDays(p.pickup, p.checkout!)
  if (late > 0 && p.reason !== 'SURRENDER') {
    lines.push({ description: `Late pickup (${late} days)`, qty: late, unitPrice: 25, amount: late * 25, kind: 'LATE_FEE' })
  }
  let total = 0
  for (const l of lines) total += l.amount

  const ageDays = daysBetween(issuedAt, TODAY)
  let status = 'UNPAID'
  const payments: { amount: number; method: string; paidAt: Date }[] = []
  if (total === 0) status = 'PAID'
  else if (ageDays > 40 && rng.chance(0.95)) {
    status = 'PAID'
    if (rng.chance(0.15)) {
      const first = round2(total / 2)
      payments.push({ amount: first, method: 'GOLD', paidAt: new Date(issuedAt.getTime() + 5 * 86400000) })
      payments.push({ amount: round2(total - first), method: rng.pick(['GOLD', 'GEMS']), paidAt: new Date(issuedAt.getTime() + 25 * 86400000) })
    } else {
      payments.push({ amount: round2(total), method: rng.weighted([['GOLD', 7], ['GEMS', 2], ['IOU', 1]] as const), paidAt: new Date(issuedAt.getTime() + rng.int(1, 35) * 86400000) })
    }
  } else if (ageDays > 40 && rng.chance(0.5)) {
    status = 'VOID'
  }

  await prisma.invoice.create({
    data: {
      stayId,
      customerId: p.customerId,
      issuedAt,
      dueDate: new Date(Date.UTC(issuedAt.getUTCFullYear(), issuedAt.getUTCMonth(), issuedAt.getUTCDate() + 30)),
      total: round2(total),
      status,
      lines: { create: lines.map((l) => ({ ...l, unitPrice: l.unitPrice, amount: round2(l.amount) })) },
      payments: { create: payments },
    },
  })
}

/** What `npm run billing:backfill` did in March 2024: v2 copies of everything older. */
export async function seedBillingV2Backfill(prisma: PrismaClient) {
  const cutoff = new Date('2024-03-01')
  const legacy = await prisma.invoice.findMany({ where: { issuedAt: { lt: cutoff } }, include: { lines: true, payments: true }, orderBy: { id: 'asc' } })
  const toCopper = (g: unknown) => Math.round(Number(g ?? 0) * 100)
  for (const inv of legacy) {
    const lines = inv.lines.map((l, position) => ({
      description: l.description ?? '',
      quantity: l.qty ?? 1,
      unitCopper: toCopper(l.unitPrice),
      amountCopper: toCopper(l.amount),
      kind: l.kind ?? 'OTHER',
      position,
    }))
    const total = lines.reduce((s, l) => s + l.amountCopper, 0)
    await prisma.invoiceV2.create({
      data: {
        legacyInvoiceId: inv.id,
        stayId: inv.stayId,
        customerId: inv.customerId,
        number: `BC-${(inv.issuedAt ?? cutoff).getFullYear()}-L${String(inv.id).padStart(5, '0')}`,
        status: inv.status === 'PAID' ? 'PAID' : inv.status === 'VOID' ? 'VOID' : 'ISSUED',
        issuedAt: inv.issuedAt,
        dueAt: inv.dueDate,
        subtotalCopper: total,
        totalCopper: total,
        createdAt: new Date('2024-03-04T22:00:00Z'),
        lines: { create: lines },
        payments: { create: inv.payments.map((p) => ({ amountCopper: toCopper(p.amount), method: p.method ?? 'GOLD', receivedAt: p.paidAt ?? cutoff })) },
      },
    })
  }
  return legacy.length
}

// --- monster status + lairs -------------------------------------------------

function fits(lair: SeedLair, m: SeedMonster) {
  const s = m.species
  return lair.temperatureC >= s.tempMinC - 3 && lair.temperatureC <= s.tempMaxC + 3 && lair.humidity >= s.humidityMin - 10 && lair.humidity <= s.humidityMax + 10
}

export async function seedResidents(prisma: PrismaClient, rng: Rng, world: World, stays: SeededStay[]) {
  const current = new Map(stays.filter((s) => s.status === 'CHECKED_IN').map((s) => [s.monster.id, s]))
  const rules = await prisma.speciesCompatibility.findMany()
  const blocked = (a: number, b: number) => rules.some((r) => (r.speciesId === a && r.incompatibleSpeciesId === b) || (r.speciesId === b && r.incompatibleSpeciesId === a))

  const residents: SeedMonster[] = []
  for (const m of world.monsters) {
    let status: string
    if (current.has(m.id)) status = 'IN_RESIDENCE'
    else if (m.ownerId === null) status = m.key === 'whisper' ? 'IN_RESIDENCE' : rng.weighted([['AVAILABLE', 70], ['HIRED', 22], ['RETIRED', 8]] as const)
    else status = 'HOME'
    if (m.key === 'grumbold') status = 'AVAILABLE'
    await prisma.monster.update({ where: { id: m.id }, data: { status } })
    if (status === 'IN_RESIDENCE' || status === 'AVAILABLE') residents.push(m)
  }

  // Who lives where. Clucky just arrived and has no lair yet; neither do a couple of others.
  const unhoused = new Set(['clucky'])
  const occupancy = new Map<number, SeedMonster[]>()
  const preferred: Record<string, string> = {
    snortlewick: 'The Ember Vault',
    fangsworth: 'The Web Room',
    mumbles: 'The Quiet Room',
    nibbles: 'The Quiet Room',
    hester: 'The Moat (South)',
    pebble: 'The Perch',
    basil: 'The Stone Garden',
    whisper: 'The Draughty Attic',
    bramble: 'The Rookery',
    grumbold: 'The Great Hall Pen',
  }
  const activeLairs = world.lairs.filter((l) => l.isActive)
  let skipped = 0

  for (const m of residents) {
    if (m.key && unhoused.has(m.key)) continue
    let lair = m.key && preferred[m.key] ? activeLairs.find((l) => l.name === preferred[m.key!]) : undefined
    if (!lair) {
      const candidates = rng.shuffle(activeLairs).filter((l) => {
        const here = occupancy.get(l.id) ?? []
        // keep The Snug one short of full, and the Stone Garden for Basil
        const cap = l.name === 'The Snug' ? l.capacity - 1 : l.name === 'The Stone Garden' ? 1 : l.capacity
        return here.length < cap && fits(l, m) && !here.some((h) => blocked(h.species.id, m.species.id))
      })
      lair = candidates[0]
    }
    if (!lair || (skipped < 2 && !m.key && rng.chance(0.05))) {
      skipped++
      continue
    }
    const here = occupancy.get(lair.id) ?? []
    here.push(m)
    occupancy.set(lair.id, here)
    const stay = current.get(m.id)
    await prisma.lairAssignment.create({
      data: {
        lairId: lair.id,
        monsterId: m.id,
        assignedById: world.users.keeper.id,
        assignedAt: stay ? at(stay.start, 17) : at(-rng.int(30, 300), 17),
      },
    })
  }
}
