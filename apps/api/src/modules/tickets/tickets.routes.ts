import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import { commentSchema, createTicketSchema, listQuerySchema, statusSchema, updateTicketSchema, type ListQuery } from './tickets.schema'
import * as ticketsService from './tickets.service'
import { createWeeklyCleaningTickets } from './recurring'

export const ticketsRouter = Router()

ticketsRouter.use(requireRole('ADMIN', 'KEEPER', 'FRONT_DESK', 'VET'))

ticketsRouter.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await ticketsService.listTickets(req.query as unknown as ListQuery, req.user!.id))
  }),
)

ticketsRouter.get(
  '/assignees',
  asyncHandler(async (_req, res) => {
    res.json(await ticketsService.assignees())
  }),
)

ticketsRouter.post(
  '/recurring/run',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    res.json(await createWeeklyCleaningTickets(new Date(), req.user!.id))
  }),
)

ticketsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await ticketsService.getTicket(Number(req.params.id)))
  }),
)

ticketsRouter.post(
  '/',
  validate(createTicketSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await ticketsService.createTicket(req.body, req.user!.id))
  }),
)

ticketsRouter.patch(
  '/:id',
  validate(updateTicketSchema),
  asyncHandler(async (req, res) => {
    res.json(await ticketsService.updateTicket(Number(req.params.id), req.body, req.user!.id))
  }),
)

ticketsRouter.patch(
  '/:id/status',
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    res.json(await ticketsService.setStatus(Number(req.params.id), req.body.status))
  }),
)

ticketsRouter.post(
  '/:id/comments',
  validate(commentSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await ticketsService.addComment(Number(req.params.id), req.user!.id, req.body.body))
  }),
)
