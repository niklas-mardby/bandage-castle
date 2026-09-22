// Recurring cleaning tickets, generated from the cleaning rota.
// Run from Admin → Tickets → "Create this week's cleaning tickets", or POST /api/tickets/recurring/run.
import { prisma } from '../../db/prisma'

/** Which wings get cleaned on which weekday (0 = Sunday). Matches the Bulletin page "Lair cleaning rota". */
export const CLEANING_ROTA: Record<number, string[]> = {
  1: ['NORTH_TOWER'],
  2: ['DUNGEON'],
  3: ['EAST_WING'],
  4: ['MOAT'],
  5: ['CELLAR', 'ROOFTOP'],
}

export function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return new Date(d.getTime() + diff * 24 * 60 * 60 * 1000)
}

export type PlannedCleaning = { lairId: number; lairName: string; dueDate: Date; title: string }

export function planWeek(lairs: { id: number; name: string; wing: string; isActive: boolean }[], weekStart: Date): PlannedCleaning[] {
  const planned: PlannedCleaning[] = []
  for (const [weekday, wings] of Object.entries(CLEANING_ROTA)) {
    const dueDate = new Date(weekStart.getTime() + (Number(weekday) - 1) * 24 * 60 * 60 * 1000)
    for (const lair of lairs.filter((l) => l.isActive && wings.includes(l.wing))) {
      planned.push({ lairId: lair.id, lairName: lair.name, dueDate, title: `Weekly clean: ${lair.name}` })
    }
  }
  return planned
}

/** Creates the cleaning tickets for the week of `date`. Skips lairs that already have one for that day. */
export async function createWeeklyCleaningTickets(date: Date, reporterId: number) {
  const weekStart = mondayOf(date)
  const lairs = await prisma.lair.findMany({ select: { id: true, name: true, wing: true, isActive: true } })
  const planned = planWeek(lairs, weekStart)
  let created = 0
  for (const p of planned) {
    const exists = await prisma.ticket.findFirst({ where: { lairId: p.lairId, category: 'CLEANING', dueDate: p.dueDate, title: p.title } })
    if (exists) continue
    await prisma.ticket.create({
      data: { title: p.title, category: 'CLEANING', priority: 'LOW', lairId: p.lairId, dueDate: p.dueDate, reporterId, description: 'Created from the cleaning rota. Bring your own mop.' },
    })
    created++
  }
  return { weekStart: weekStart.toISOString().slice(0, 10), planned: planned.length, created }
}
