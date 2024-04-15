// New (Prisma) stay endpoints. Booking, check-in and check-out still live
// in legacy/stays until we migrate them.
import { Router } from 'express'
import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'

export const staysRouter = Router()

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
