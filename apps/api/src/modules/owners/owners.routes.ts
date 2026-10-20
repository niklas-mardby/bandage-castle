// Owner-facing endpoints (2026). Everything here checks that the monster belongs to the caller.
import { Router } from 'express'
import { ageInYears } from '@bandage/shared'
import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'

export const ownersRouter = Router()

ownersRouter.use(requireRole('OWNER'))

ownersRouter.get(
  '/monsters/:id/diary',
  asyncHandler(async (req, res) => {
    const monster = await prisma.monster.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        species: { select: { name: true, diet: true } },
        stays: { orderBy: { startDate: 'desc' }, select: { id: true, reason: true, status: true, startDate: true, expectedPickup: true, checkedInAt: true, checkedOutAt: true } },
        lairAssignments: { where: { releasedAt: null }, select: { lair: { select: { name: true, wing: true } } } },
        medicalRecords: { orderBy: { visitDate: 'desc' }, take: 5, select: { visitDate: true, summary: true, treatments: { select: { name: true, status: true } } } },
        therapyPlans: { select: { issue: true, status: true, _count: { select: { sessions: true } } } },
      },
    })
    // same answer for "doesn't exist" and "not yours", so ids can't be probed
    if (!monster || monster.ownerId !== req.user!.customerId) throw new NotFoundError('Monster')

    const today = new Date()
    const meals = await prisma.feedingLog.count({ where: { monsterId: monster.id, date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) } })

    res.json({
      id: monster.id,
      name: monster.name,
      age: ageInYears(monster.birthDate),
      species: monster.species,
      status: monster.status,
      quirks: monster.quirks,
      lair: monster.lairAssignments[0]?.lair ?? null,
      mealsServedToday: meals,
      stays: monster.stays,
      // owners see what was done, not the vets' notes
      health: monster.medicalRecords.map((r) => ({ date: r.visitDate, summary: r.summary, treatments: r.treatments })),
      therapy: monster.therapyPlans.map((p) => ({ issue: p.issue, status: p.status, sessions: p._count.sessions })),
    })
  }),
)
