import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole, requireUser } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import * as flagsService from './flags.service'
import * as audit from '../audit/audit.service'

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
    const flag = await flagsService.setFlag(req.params.key, req.body.enabled)
    await audit.record({ actorId: req.user!.id, entity: 'flag', entityId: flag.key, action: 'UPDATE', before: { enabled: !flag.enabled }, after: { enabled: flag.enabled } })
    res.json(flag)
  }),
)
