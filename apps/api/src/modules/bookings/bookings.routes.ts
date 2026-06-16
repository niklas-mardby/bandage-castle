import { Router } from 'express'
import { hasRole } from '@bandage/shared'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import * as bookings from './bookings.service'

export const bookingsRouter = Router()

const DESK = ['ADMIN', 'FRONT_DESK'] as const

bookingsRouter.get(
  '/',
  requireRole('OWNER', ...DESK),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' && req.query.status ? req.query.status : undefined
    const customerId = hasRole(req.user, ...DESK) ? undefined : (req.user!.customerId ?? -1)
    res.json(await bookings.listRequests({ customerId, status }))
  }),
)

bookingsRouter.post(
  '/',
  requireRole('OWNER'),
  validate(bookings.requestSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await bookings.createRequest(req.user!.customerId, req.body, req.user!.id))
  }),
)

bookingsRouter.post(
  '/:id/approve',
  requireRole(...DESK),
  validate(bookings.approveSchema),
  asyncHandler(async (req, res) => {
    res.json(await bookings.approveRequest(Number(req.params.id), req.body, req.user!.id))
  }),
)

bookingsRouter.post(
  '/:id/decline',
  requireRole(...DESK),
  validate(bookings.declineSchema),
  asyncHandler(async (req, res) => {
    res.json(await bookings.declineRequest(Number(req.params.id), req.body.note, req.user!.id))
  }),
)

bookingsRouter.post(
  '/:id/cancel',
  requireRole('OWNER'),
  asyncHandler(async (req, res) => {
    res.json(await bookings.cancelRequest(Number(req.params.id), req.user!.customerId))
  }),
)
