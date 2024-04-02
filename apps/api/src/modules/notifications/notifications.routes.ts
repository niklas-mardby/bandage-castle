import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireUser } from '../../middleware/requireRole'
import { NotificationService } from './notification.service'

export const notificationsRouter = Router()

notificationsRouter.use(requireUser)

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await NotificationService.listForUser(req.user!.id, { unreadOnly: req.query.unread === '1' }))
  }),
)

notificationsRouter.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    res.json(await NotificationService.markRead(Number(req.params.id), req.user!.id))
  }),
)

notificationsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    res.json({ updated: await NotificationService.markAllRead(req.user!.id) })
  }),
)
