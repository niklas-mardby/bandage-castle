// New monster endpoints. List, search, create and the classic detail are still in legacy/monsters.
import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { MONSTER_STATUSES, STAFF_ROLES, ageInYears } from '@bandage/shared'
import { prisma } from '../../db/prisma'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { monsterProfile } from './profile.service'

export const monsterProfilesRouter = Router()

const browseSchema = z.object({
  q: z.string().trim().max(100).optional(),
  speciesId: z.coerce.number().int().positive().optional(),
  status: z.enum(MONSTER_STATUSES).optional(),
  lairId: z.coerce.number().int().positive().optional(),
  unhoused: z.enum(['1']).optional(),
  ownerless: z.enum(['1']).optional(),
})

/** Staff monster browser with filters (Prisma). The classic list is still GET /api/monsters. */
monsterProfilesRouter.get(
  '/',
  requireRole(...STAFF_ROLES),
  validate(browseSchema, 'query'),
  asyncHandler(async (req, res) => {
    const f = req.query as z.infer<typeof browseSchema>
    const where: Prisma.MonsterWhereInput = {}
    if (f.q) where.name = { contains: f.q }
    if (f.speciesId) where.speciesId = f.speciesId
    if (f.status) where.status = f.status
    if (f.lairId) where.lairAssignments = { some: { lairId: f.lairId, releasedAt: null } }
    if (f.unhoused) where.lairAssignments = { none: { releasedAt: null } }
    if (f.ownerless) where.ownerId = null
    const monsters = await prisma.monster.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        birthDate: true,
        species: { select: { id: true, name: true, dangerLevel: true } },
        owner: { select: { id: true, title: true, firstName: true, lastName: true } },
        lairAssignments: { where: { releasedAt: null }, select: { lair: { select: { id: true, name: true } } } },
      },
      orderBy: { name: 'asc' },
      take: 500,
    })
    res.json(
      monsters.map(({ lairAssignments, ...m }) => ({
        ...m,
        age: ageInYears(m.birthDate),
        lair: lairAssignments[0]?.lair ?? null,
        ownerName: m.owner ? [m.owner.title, m.owner.firstName, m.owner.lastName].filter(Boolean).join(' ') : null,
      })),
    )
  }),
)

monsterProfilesRouter.get(
  '/:id',
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    res.json(await monsterProfile(Number(req.params.id)))
  }),
)
