import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole, requireUser } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import { ruleSchema, speciesSchema } from './species.schema'
import * as speciesService from './species.service'
import { cached, invalidate } from '../../cache'

export const speciesRouter = Router()

// Everyone logged in can read the compendium (owners like to look up their pets).
speciesRouter.get(
  '/',
  requireUser,
  asyncHandler(async (_req, res) => {
    // the list does a lot of counting, cache it for a minute (#47)
    res.json(await cached('species:list', 60, () => speciesService.listSpecies()))
  }),
)

speciesRouter.get(
  '/:slugOrId',
  requireUser,
  asyncHandler(async (req, res) => {
    res.json(await speciesService.getSpecies(req.params.slugOrId))
  }),
)

speciesRouter.post(
  '/',
  requireRole('ADMIN', 'VET'),
  validate(speciesSchema),
  asyncHandler(async (req, res) => {
    await invalidate('species:')
    res.status(201).json(await speciesService.createSpecies(req.body))
  }),
)

speciesRouter.put(
  '/:id',
  requireRole('ADMIN', 'VET'),
  validate(speciesSchema),
  asyncHandler(async (req, res) => {
    await invalidate('species:')
    res.json(await speciesService.updateSpecies(Number(req.params.id), req.body))
  }),
)

speciesRouter.post(
  '/:id/rules',
  requireRole('ADMIN', 'VET', 'KEEPER'),
  validate(ruleSchema),
  asyncHandler(async (req, res) => {
    await invalidate('species:')
    res.status(201).json(await speciesService.addRule(Number(req.params.id), req.body))
  }),
)

speciesRouter.delete(
  '/:id/rules/:ruleId',
  requireRole('ADMIN', 'VET', 'KEEPER'),
  asyncHandler(async (req, res) => {
    await speciesService.removeRule(Number(req.params.ruleId))
    await invalidate('species:')
    res.status(204).end()
  }),
)
