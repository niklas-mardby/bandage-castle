import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import * as feedingService from './feeding.service'

export const feedingRouter = Router()

feedingRouter.use(requireRole('ADMIN', 'KEEPER', 'VET'))

const logSchema = z.object({
  monsterId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealTime: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().max(255).optional(),
})

const overrideSchema = z.object({
  lairId: z.number().int().positive(),
  speciesId: z.number().int().positive().nullable().optional(),
  mealsPerDay: z.number().int().min(0).max(12).nullable().optional(),
  portionKg: z.number().min(0).max(5000).nullable().optional(),
  food: z.string().max(255).nullable().optional(),
  note: z.string().max(255).nullable().optional(),
})

feedingRouter.get(
  '/overrides',
  asyncHandler(async (_req, res) => {
    res.json(await feedingService.listOverrides())
  }),
)

feedingRouter.post(
  '/overrides',
  requireRole('ADMIN', 'KEEPER'),
  validate(overrideSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await feedingService.createOverride(req.body, req.user!.id))
  }),
)

feedingRouter.delete(
  '/overrides/:id',
  requireRole('ADMIN', 'KEEPER'),
  asyncHandler(async (req, res) => {
    await feedingService.deleteOverride(Number(req.params.id))
    res.status(204).end()
  }),
)

feedingRouter.get(
  '/schedule',
  asyncHandler(async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined
    res.json(await feedingService.scheduleFor(date))
  }),
)

feedingRouter.post(
  '/logs',
  validate(logSchema),
  asyncHandler(async (req, res) => {
    const { monsterId, date, mealTime, note } = req.body
    res.status(201).json(await feedingService.markFed(monsterId, date, mealTime, req.user!.id, note))
  }),
)

feedingRouter.delete(
  '/logs',
  validate(logSchema),
  asyncHandler(async (req, res) => {
    const { monsterId, date, mealTime } = req.body
    await feedingService.unmarkFed(monsterId, date, mealTime)
    res.status(204).end()
  }),
)
