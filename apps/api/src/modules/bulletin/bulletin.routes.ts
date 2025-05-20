import { Router } from 'express'
import { z } from 'zod'
import { hasRole, STAFF_ROLES } from '@bandage/shared'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import { pageSchema } from './bulletin.schema'
import * as bulletin from './bulletin.service'

export const bulletinRouter = Router()

// all staff can read the Bulletin
bulletinRouter.use(requireRole(...STAFF_ROLES))

const WRITERS = ['SCRIBE', 'ADMIN'] as const
const canWrite = requireRole(...WRITERS)

bulletinRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(
      await bulletin.listPages({
        kind: typeof req.query.kind === 'string' ? req.query.kind : undefined,
        search: typeof req.query.q === 'string' && req.query.q ? req.query.q : undefined,
        includeDrafts: hasRole(req.user, ...WRITERS),
      }),
    )
  }),
)

bulletinRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    res.json(await bulletin.getPage(req.params.slug, hasRole(req.user, ...WRITERS)))
  }),
)

bulletinRouter.get(
  '/:id/revisions',
  canWrite,
  asyncHandler(async (req, res) => {
    res.json(await bulletin.revisions(Number(req.params.id)))
  }),
)

bulletinRouter.post(
  '/',
  canWrite,
  validate(pageSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await bulletin.createPage(req.body, req.user!.id))
  }),
)

bulletinRouter.patch(
  '/:id',
  canWrite,
  validate(pageSchema.partial()),
  asyncHandler(async (req, res) => {
    res.json(await bulletin.updatePage(Number(req.params.id), req.body, req.user!.id))
  }),
)

bulletinRouter.post(
  '/:id/publish',
  canWrite,
  validate(z.object({ published: z.boolean() })),
  asyncHandler(async (req, res) => {
    res.json(await bulletin.setPublished(Number(req.params.id), req.body.published))
  }),
)

bulletinRouter.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await bulletin.deletePage(Number(req.params.id))
    res.status(204).end()
  }),
)
