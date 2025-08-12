import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import * as dashboard from './dashboard.service'

export const dashboardRouter = Router()

dashboardRouter.get(
  '/admin',
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    res.json(await dashboard.admin())
  }),
)

dashboardRouter.get(
  '/front-desk',
  requireRole('FRONT_DESK', 'ADMIN'),
  asyncHandler(async (_req, res) => {
    res.json(await dashboard.frontDesk())
  }),
)

dashboardRouter.get(
  '/keeper',
  requireRole('KEEPER'),
  asyncHandler(async (req, res) => {
    res.json(await dashboard.keeper(req.user!.id))
  }),
)

dashboardRouter.get(
  '/vet',
  requireRole('VET'),
  asyncHandler(async (_req, res) => {
    res.json(await dashboard.vet())
  }),
)

dashboardRouter.get(
  '/therapist',
  requireRole('THERAPIST'),
  asyncHandler(async (req, res) => {
    res.json(await dashboard.therapist(req.user!.id))
  }),
)

dashboardRouter.get(
  '/scribe',
  requireRole('SCRIBE', 'ADMIN'),
  asyncHandler(async (_req, res) => {
    res.json(await dashboard.scribe())
  }),
)

dashboardRouter.get(
  '/me',
  requireRole('OWNER', 'OVERLORD'),
  asyncHandler(async (req, res) => {
    res.json(await dashboard.customer(req.user!.customerId))
  }),
)
