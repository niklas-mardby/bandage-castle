import { Router } from 'express'
import { STAFF_ROLES } from '@bandage/shared'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import * as settings from './settings.service'

export const settingsRouter = Router()

settingsRouter.get(
  '/',
  requireRole(...STAFF_ROLES),
  asyncHandler(async (_req, res) => {
    res.json(await settings.getAll())
  }),
)

// value is validated against the schema for that key in settings.service
settingsRouter.put(
  '/:key',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    res.json(await settings.set(req.params.key, req.body, req.user!.id))
  }),
)
