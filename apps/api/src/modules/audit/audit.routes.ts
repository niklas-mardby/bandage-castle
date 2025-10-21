import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import * as audit from './audit.service'

export const auditRouter = Router()

auditRouter.get(
  '/',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const q = req.query
    res.json(
      await audit.list({
        entity: typeof q.entity === 'string' && q.entity ? q.entity : undefined,
        entityId: typeof q.entityId === 'string' && q.entityId ? q.entityId : undefined,
        actorId: q.actorId ? Number(q.actorId) : undefined,
        before: q.before ? Number(q.before) : undefined,
        take: q.take ? Math.min(200, Number(q.take)) : undefined,
      }),
    )
  }),
)
