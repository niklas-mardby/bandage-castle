import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole, requireUser } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import * as flagsService from './flags.service'

export const flagsRouter = Router()

/** { ENABLE_BILLING_V2: false, ... } for the front end */
flagsRouter.get(
  '/',
  requireUser,
  asyncHandler(async (_req, res) => {
    res.json(await flagsService.allFlags())
  }),
)

flagsRouter.get(
  '/detailed',
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    res.json(await flagsService.listFlagsDetailed())
  }),
)

flagsRouter.put(
  '/:key',
  requireRole('ADMIN'),
  validate(z.object({ enabled: z.boolean() })),
  asyncHandler(async (req, res) => {
    res.json(await flagsService.setFlag(req.params.key, req.body.enabled))
  }),
)
