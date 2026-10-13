import { Router } from 'express'
import { z } from 'zod'
import { hasRole } from '@bandage/shared'
import { prisma } from '../../db/prisma'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/httpErrors'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import { NotificationService } from '../notifications/notification.service'
import * as settings from '../settings/settings.service'
import { MAX_VISITS_PER_SLOT, slotsFor, visitProblem } from './visitRules'

export const visitsRouter = Router()

const STAFF = ['ADMIN', 'FRONT_DESK', 'KEEPER'] as const

const bookSchema = z.object({
  monsterId: z.number().int().positive(),
  visitAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)),
  durationMin: z.number().int().min(30).max(120).default(30),
  guests: z.number().int().min(1).max(10).default(1),
  note: z.string().max(255).optional(),
})

async function visitingHours() {
  const h = await settings.get('opening_hours')
  return { visitingFrom: h.visitingFrom, visitingUntil: h.visitingUntil, closedDays: h.closedDays }
}

visitsRouter.get(
  '/slots',
  requireRole('OWNER', ...STAFF),
  asyncHandler(async (_req, res) => {
    const hours = await visitingHours()
    res.json({ ...hours, slots: slotsFor(hours) })
  }),
)

visitsRouter.get(
  '/',
  requireRole('OWNER', ...STAFF),
  asyncHandler(async (req, res) => {
    const staff = hasRole(req.user, ...STAFF)
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : new Date(new Date().setHours(0, 0, 0, 0))
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)
    const visits = await prisma.visit.findMany({
      where: staff ? { visitAt: { gte: from, lt: to } } : { customerId: req.user!.customerId ?? -1 },
      orderBy: { visitAt: 'asc' },
    })
    const [monsters, customers] = await Promise.all([
      prisma.monster.findMany({ where: { id: { in: visits.map((v) => v.monsterId) } }, select: { id: true, name: true } }),
      prisma.customer.findMany({ where: { id: { in: visits.map((v) => v.customerId) } }, select: { id: true, title: true, lastName: true } }),
    ])
    res.json(
      visits.map((v) => ({
        ...v,
        monsterName: monsters.find((m) => m.id === v.monsterId)?.name ?? '?',
        customerName: (() => {
          const c = customers.find((x) => x.id === v.customerId)
          return c ? `${c.title ?? ''} ${c.lastName ?? ''}`.trim() : '?'
        })(),
      })),
    )
  }),
)

visitsRouter.post(
  '/',
  requireRole('OWNER'),
  validate(bookSchema),
  asyncHandler(async (req, res) => {
    const customerId = req.user!.customerId
    if (!customerId) throw new BadRequestError('Your account has no customer profile')
    const monster = await prisma.monster.findUnique({ where: { id: req.body.monsterId } })
    if (!monster || monster.ownerId !== customerId) throw new ForbiddenError('You can only visit your own monsters')
    if (monster.status !== 'IN_RESIDENCE') throw new BadRequestError(`${monster.name} is not staying with us right now`)

    const visitAt = new Date(req.body.visitAt)
    const problem = visitProblem(await visitingHours(), visitAt, req.body.durationMin, req.body.guests)
    if (problem) throw new BadRequestError(problem)

    const sameSlot = await prisma.visit.count({ where: { visitAt, status: { in: ['REQUESTED', 'CONFIRMED'] } } })
    if (sameSlot >= MAX_VISITS_PER_SLOT) throw new ConflictError('That slot is full. Try half an hour later?')

    const visit = await prisma.visit.create({ data: { ...req.body, visitAt, customerId } })
    await NotificationService.notifyRole(['FRONT_DESK'], `Visit requested: ${monster.name}`, `${visitAt.toLocaleString('en-GB')}, ${req.body.guests} guest(s)`, '/visits')
    res.status(201).json(visit)
  }),
)

visitsRouter.post(
  '/:id/confirm',
  requireRole(...STAFF),
  asyncHandler(async (req, res) => {
    const visit = await prisma.visit.findUnique({ where: { id: Number(req.params.id) } })
    if (!visit) throw new NotFoundError('Visit')
    const updated = await prisma.visit.update({ where: { id: visit.id }, data: { status: 'CONFIRMED' } })
    await NotificationService.notifyCustomer(visit.customerId, 'Your visit is confirmed', `See you on ${visit.visitAt.toLocaleString('en-GB')}. Mind the moat.`)
    res.json(updated)
  }),
)

visitsRouter.post(
  '/:id/cancel',
  requireRole('OWNER', ...STAFF),
  asyncHandler(async (req, res) => {
    const visit = await prisma.visit.findUnique({ where: { id: Number(req.params.id) } })
    if (!visit) throw new NotFoundError('Visit')
    if (!hasRole(req.user, ...STAFF) && visit.customerId !== req.user!.customerId) throw new NotFoundError('Visit')
    res.json(await prisma.visit.update({ where: { id: visit.id }, data: { status: 'CANCELLED' } }))
  }),
)

visitsRouter.post(
  '/:id/done',
  requireRole(...STAFF),
  asyncHandler(async (req, res) => {
    res.json(await prisma.visit.update({ where: { id: Number(req.params.id) }, data: { status: 'DONE' } }))
  }),
)
