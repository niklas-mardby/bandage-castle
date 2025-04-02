import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import { createPlanSchema, sessionSchema, updatePlanSchema } from './therapy.schema'
import * as therapyService from './therapy.service'

export const therapyRouter = Router()

// Session notes are confidential: therapists and admins only.
// Keepers can see that a plan exists (via the monster page), not the notes.
therapyRouter.use(requireRole('THERAPIST', 'ADMIN'))

therapyRouter.get(
  '/plans',
  asyncHandler(async (req, res) => {
    res.json(
      await therapyService.listPlans({
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        therapistId: req.query.mine === '1' ? req.user!.id : undefined,
        monsterId: req.query.monsterId ? Number(req.query.monsterId) : undefined,
      }),
    )
  }),
)

therapyRouter.get(
  '/plans/:id',
  asyncHandler(async (req, res) => {
    res.json(await therapyService.getPlan(Number(req.params.id)))
  }),
)

therapyRouter.post(
  '/plans',
  requireRole('THERAPIST'),
  validate(createPlanSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await therapyService.createPlan(req.body, req.user!.id))
  }),
)

therapyRouter.patch(
  '/plans/:id',
  requireRole('THERAPIST'),
  validate(updatePlanSchema),
  asyncHandler(async (req, res) => {
    res.json(await therapyService.updatePlan(Number(req.params.id), req.body))
  }),
)

therapyRouter.post(
  '/plans/:id/sessions',
  requireRole('THERAPIST'),
  validate(sessionSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await therapyService.addSession(Number(req.params.id), req.body))
  }),
)
