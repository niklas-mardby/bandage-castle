// New monster endpoints. List, search, create and the classic detail are still in legacy/monsters.
import { Router } from 'express'
import { STAFF_ROLES } from '@bandage/shared'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { monsterProfile } from './profile.service'

export const monsterProfilesRouter = Router()

monsterProfilesRouter.get(
  '/:id',
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    res.json(await monsterProfile(Number(req.params.id)))
  }),
)
