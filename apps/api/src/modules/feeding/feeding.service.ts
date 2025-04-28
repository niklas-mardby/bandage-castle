import { prisma } from '../../db/prisma'
import { BadRequestError } from '../../errors/httpErrors'
import { buildSchedule, shoppingList, type FeedingInput } from './schedule'

function parseDay(day: string | undefined): Date {
  const value = day ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestError('date must be YYYY-MM-DD')
  return new Date(value)
}

export async function scheduleFor(day?: string) {
  const date = parseDay(day)
  const assignments = await prisma.lairAssignment.findMany({
    // Checked-out monsters keep their assignment until a keeper moves them out (legacy check-out doesn't
    // know about lairs). Monsters waiting in the Hiring Hall live here too and are AVAILABLE, not IN_RESIDENCE.
    where: { releasedAt: null, monster: { status: { in: ['IN_RESIDENCE', 'AVAILABLE'] } } },
    include: {
      lair: true,
      monster: { include: { species: true } },
    },
  })

  const inputs: FeedingInput[] = assignments
    .filter((a) => a.monster.species)
    .map((a) => ({
      lair: { id: a.lair.id, name: a.lair.name, wing: a.lair.wing },
      monster: { id: a.monster.id, name: a.monster.name },
      species: {
        name: a.monster.species!.name,
        diet: a.monster.species!.diet,
        mealsPerDay: a.monster.species!.mealsPerDay,
        portionKg: Number(a.monster.species!.portionKg),
      },
    }))

  const entries = buildSchedule(inputs)
  const logs = await prisma.feedingLog.findMany({ where: { date } })
  const fed = new Set(logs.map((l) => `${l.monsterId}@${l.mealTime}`))

  return {
    date: date.toISOString().slice(0, 10),
    entries: entries.map((e) => ({ ...e, fed: fed.has(`${e.monsterId}@${e.time}`) })),
    shoppingList: shoppingList(entries),
    // monsters in a lair whose species we don't know can't be planned for
    unknownDiet: assignments.filter((a) => !a.monster.species).map((a) => ({ id: a.monster.id, name: a.monster.name })),
  }
}

export async function markFed(monsterId: number, day: string, mealTime: string, userId: number, note?: string) {
  const date = parseDay(day)
  return prisma.feedingLog.upsert({
    where: { monsterId_date_mealTime: { monsterId, date, mealTime } },
    update: { fedById: userId, fedAt: new Date(), note },
    create: { monsterId, date, mealTime, fedById: userId, note },
  })
}

export async function unmarkFed(monsterId: number, day: string, mealTime: string) {
  const date = parseDay(day)
  await prisma.feedingLog.deleteMany({ where: { monsterId, date, mealTime } })
}
