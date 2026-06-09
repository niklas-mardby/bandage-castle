// New (Prisma) stay endpoints. Booking, check-in and check-out still live
// in legacy/stays until we migrate them.
import { Router } from 'express'
import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'

export const staysRouter = Router()

/**
 * Stays overlapping a month, for the calendar. Must be registered before
 * /:id routes, and before the legacy router (which would treat "calendar" as an id).
 */
staysRouter.get(
  '/calendar',
  requireRole('ADMIN', 'FRONT_DESK', 'KEEPER', 'VET', 'THERAPIST'),
  asyncHandler(async (req, res) => {
    const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : new Date().toISOString().slice(0, 7)
    const [y, m] = month.split('-').map(Number)
    const first = new Date(Date.UTC(y, m - 1, 1))
    const last = new Date(Date.UTC(y, m, 0))
    const stays = await prisma.stay.findMany({
      where: {
        status: { not: 'CANCELLED' },
        startDate: { lte: last },
        OR: [{ expectedPickup: null }, { expectedPickup: { gte: first } }],
      },
      select: {
        id: true,
        reason: true,
        status: true,
        startDate: true,
        expectedPickup: true,
        checkedOutAt: true,
        monster: { select: { id: true, name: true, species: { select: { name: true } } } },
      },
      orderBy: { startDate: 'asc' },
    })
    res.json({ month, days: last.getUTCDate(), stays })
  }),
)

staysRouter.get(
  '/:id/details',
  requireRole('ADMIN', 'FRONT_DESK', 'KEEPER', 'VET'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const stay = await prisma.stay.findUnique({
      where: { id },
      include: {
        monster: {
          select: {
            id: true,
            name: true,
            status: true,
            species: { select: { name: true, slug: true } },
            lairAssignments: { where: { releasedAt: null }, select: { lair: { select: { id: true, name: true } } } },
          },
        },
        customer: { select: { id: true, title: true, firstName: true, lastName: true, contactPref: true } },
        extensions: { orderBy: { createdAt: 'asc' } },
        invoices: { select: { id: true, total: true, status: true } },
      },
    })
    if (!stay) throw new NotFoundError('Stay')
    const intake = await prisma.intakeForm.findUnique({ where: { stayId: id } })
    const invoicesV2 = await prisma.invoiceV2.findMany({ where: { stayId: id }, select: { id: true, number: true, totalCopper: true, status: true } })

    const { lairAssignments, ...monster } = stay.monster
    res.json({
      ...stay,
      dailyRate: Number(stay.dailyRate),
      monster: { ...monster, lair: lairAssignments[0]?.lair ?? null },
      invoices: stay.invoices.map((i) => ({ ...i, total: Number(i.total) })),
      invoicesV2,
      intake,
    })
  }),
)
