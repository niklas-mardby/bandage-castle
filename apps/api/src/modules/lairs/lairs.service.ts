import { prisma } from '../../db/prisma'
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/httpErrors'
import { habitatWarnings, type HabitatWarning } from './habitat'
import type { AssignInput, LairInput } from './lairs.schema'
import * as audit from '../audit/audit.service'

const residentInclude = {
  where: { releasedAt: null },
  include: { monster: { select: { id: true, name: true, speciesId: true, species: { select: { id: true, name: true } } } } },
  orderBy: { assignedAt: 'asc' },
} as const

export async function listLairs() {
  const lairs = await prisma.lair.findMany({
    include: { assignments: residentInclude },
    orderBy: [{ wing: 'asc' }, { name: 'asc' }],
  })
  return lairs.map(({ assignments, ...lair }) => ({
    ...lair,
    occupancy: assignments.length,
    residents: assignments.map((a) => ({ assignmentId: a.id, assignedAt: a.assignedAt, ...a.monster })),
  }))
}

export async function getLair(id: number) {
  const lair = await prisma.lair.findUnique({ where: { id }, include: { assignments: residentInclude } })
  if (!lair) throw new NotFoundError('Lair')
  const { assignments, ...rest } = lair
  return {
    ...rest,
    occupancy: assignments.length,
    residents: assignments.map((a) => ({ assignmentId: a.id, assignedAt: a.assignedAt, ...a.monster })),
  }
}

export async function createLair(input: LairInput) {
  if (await prisma.lair.findUnique({ where: { name: input.name } })) throw new ConflictError('There is already a lair with that name')
  return prisma.lair.create({ data: input })
}

export async function updateLair(id: number, input: LairInput) {
  await getLair(id)
  return prisma.lair.update({ where: { id }, data: input })
}

/** Monsters in residence that have no lair right now. */
export async function unassignedMonsters() {
  return prisma.monster.findMany({
    where: { status: 'IN_RESIDENCE', lairAssignments: { none: { releasedAt: null } } },
    select: { id: true, name: true, species: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
}

export type CompatibilityConflict = { residentSpecies: string; reason: string }

/**
 * Compatibility rules that would be broken by putting a monster of
 * `speciesId` into `lairId`.
 */
export async function findConflicts(lairId: number, speciesId: number): Promise<CompatibilityConflict[]> {
  const residents = await prisma.lairAssignment.findMany({
    where: { lairId, releasedAt: null },
    include: { monster: { select: { speciesId: true } } },
  })
  const residentSpeciesIds = residents.map((r) => r.monster.speciesId).filter((id): id is number => id !== null)
  if (residentSpeciesIds.length === 0) return []

  const rules = await prisma.speciesCompatibility.findMany({
    where: { speciesId, incompatibleSpeciesId: { in: residentSpeciesIds } },
    include: { incompatibleSpecies: { select: { name: true } } },
  })
  return rules.map((r) => ({ residentSpecies: r.incompatibleSpecies.name, reason: r.reason }))
}

export type AssignResult = { assignmentId: number; warnings: HabitatWarning[] }

export async function assignMonster(lairId: number, input: AssignInput, assignedById: number): Promise<AssignResult> {
  const lair = await prisma.lair.findUnique({ where: { id: lairId } })
  if (!lair) throw new NotFoundError('Lair')
  if (!lair.isActive) throw new BadRequestError(`${lair.name} is closed for repairs`)

  const monster = await prisma.monster.findUnique({ where: { id: input.monsterId }, include: { species: true } })
  if (!monster) throw new NotFoundError('Monster')

  const occupancy = await prisma.lairAssignment.count({ where: { lairId, releasedAt: null } })
  if (occupancy >= lair.capacity) {
    throw new ConflictError(`${lair.name} is full (${occupancy}/${lair.capacity})`)
  }

  let warnings: HabitatWarning[] = []
  if (monster.species) {
    const conflicts = await findConflicts(lairId, monster.species.id)
    if (conflicts.length > 0) {
      throw new ConflictError(
        `${monster.name} can't move in: ${conflicts.map((c) => `${c.residentSpecies} (${c.reason})`).join('; ')}`,
      )
    }
    warnings = habitatWarnings(lair, monster.species)
    if (warnings.length > 0 && !input.ignoreHabitatWarnings) {
      throw new BadRequestError('Habitat is not suitable', { warnings })
    }
  }

  const [, assignment] = await prisma.$transaction([
    // a monster can only be in one lair at a time
    prisma.lairAssignment.updateMany({ where: { monsterId: monster.id, releasedAt: null }, data: { releasedAt: new Date() } }),
    prisma.lairAssignment.create({ data: { lairId, monsterId: monster.id, assignedById } }),
  ])

  await audit.record({
    actorId: assignedById,
    entity: 'lair',
    entityId: lairId,
    action: 'ASSIGN',
    after: { monsterId: monster.id, monster: monster.name, assignmentId: assignment.id, habitatWarnings: warnings.length },
  })
  return { assignmentId: assignment.id, warnings }
}

export async function releaseAssignment(lairId: number, assignmentId: number) {
  const assignment = await prisma.lairAssignment.findFirst({ where: { id: assignmentId, lairId, releasedAt: null } })
  if (!assignment) throw new NotFoundError('Assignment')
  await prisma.lairAssignment.update({ where: { id: assignmentId }, data: { releasedAt: new Date() } })
}
