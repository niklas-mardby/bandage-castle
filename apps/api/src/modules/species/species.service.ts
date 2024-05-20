import type { Species } from '@prisma/client'
import { prisma } from '../../db/prisma'
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/httpErrors'
import type { RuleInput, SpeciesInput } from './species.schema'

export type CompatibilityRuleDto = { id: number; speciesId: number; speciesName: string; reason: string }

export type SpeciesDto = Omit<Species, 'portionKg'> & {
  portionKg: number
  residentCount: number
  incompatibleWith: CompatibilityRuleDto[]
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function rulesFor(speciesId: number): Promise<CompatibilityRuleDto[]> {
  const rules = await prisma.speciesCompatibility.findMany({ where: { speciesId } })
  const result: CompatibilityRuleDto[] = []
  for (const rule of rules) {
    const other = await prisma.species.findUnique({ where: { id: rule.incompatibleSpeciesId } })
    if (other) result.push({ id: rule.id, speciesId: other.id, speciesName: other.name, reason: rule.reason })
  }
  return result
}

async function toDto(s: Species): Promise<SpeciesDto> {
  return {
    ...s,
    portionKg: Number(s.portionKg),
    residentCount: await prisma.monster.count({ where: { speciesId: s.id, status: 'IN_RESIDENCE' } }),
    incompatibleWith: await rulesFor(s.id),
  }
}

/**
 * The whole compendium in three queries instead of 1 + 2N + rules.
 * (toDto() is still used for single species, where it doesn't matter.)
 */
export async function listSpecies(): Promise<SpeciesDto[]> {
  const [species, counts, rules] = await Promise.all([
    prisma.species.findMany({ orderBy: { name: 'asc' } }),
    prisma.monster.groupBy({ by: ['speciesId'], where: { status: 'IN_RESIDENCE' }, _count: { _all: true } }),
    prisma.speciesCompatibility.findMany({ include: { incompatibleSpecies: { select: { id: true, name: true } } } }),
  ])
  const countBySpecies = new Map(counts.map((c) => [c.speciesId, c._count._all]))
  return species.map((s) => ({
    ...s,
    portionKg: Number(s.portionKg),
    residentCount: countBySpecies.get(s.id) ?? 0,
    incompatibleWith: rules
      .filter((r) => r.speciesId === s.id)
      .map((r) => ({ id: r.id, speciesId: r.incompatibleSpecies.id, speciesName: r.incompatibleSpecies.name, reason: r.reason })),
  }))
}

export async function getSpecies(slugOrId: string) {
  const id = Number(slugOrId)
  const species = await prisma.species.findFirst({
    where: Number.isInteger(id) && id > 0 ? { id } : { slug: slugOrId },
    include: { monsters: { select: { id: true, name: true, status: true }, orderBy: { name: 'asc' } } },
  })
  if (!species) throw new NotFoundError('Species')
  const { monsters, ...rest } = species
  return { ...(await toDto(rest)), monsters }
}

export async function createSpecies(input: SpeciesInput) {
  const slug = slugify(input.name)
  if (await prisma.species.findUnique({ where: { slug } })) throw new ConflictError(`${input.name} is already in the compendium`)
  return prisma.species.create({ data: { ...input, slug } })
}

export async function updateSpecies(id: number, input: SpeciesInput) {
  const existing = await prisma.species.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Species')
  return prisma.species.update({ where: { id }, data: { ...input, slug: slugify(input.name) } })
}

export async function addRule(speciesId: number, input: RuleInput) {
  if (speciesId === input.incompatibleSpeciesId) throw new BadRequestError('A species cannot be incompatible with itself')
  const [a, b] = await Promise.all([
    prisma.species.findUnique({ where: { id: speciesId } }),
    prisma.species.findUnique({ where: { id: input.incompatibleSpeciesId } }),
  ])
  if (!a || !b) throw new NotFoundError('Species')
  return prisma.speciesCompatibility.create({
    data: { speciesId, incompatibleSpeciesId: input.incompatibleSpeciesId, reason: input.reason },
  })
}

export async function removeRule(ruleId: number) {
  await prisma.speciesCompatibility.delete({ where: { id: ruleId } })
}
