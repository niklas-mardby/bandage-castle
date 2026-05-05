import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import { contactPrefSchema, customerSchema, listQuerySchema } from './customers.schema'
import * as customers from './customers.service'

export const customersRouter = Router()

const DESK = ['ADMIN', 'FRONT_DESK'] as const

// --- customers looking at themselves ---

customersRouter.get(
  '/me',
  requireRole('OWNER', 'OVERLORD'),
  asyncHandler(async (req, res) => {
    res.json(await customers.getCustomerByUser(req.user!.id))
  }),
)

customersRouter.patch(
  '/me',
  requireRole('OWNER', 'OVERLORD'),
  validate(contactPrefSchema),
  asyncHandler(async (req, res) => {
    const me = await customers.getCustomerByUser(req.user!.id)
    res.json(await customers.updateCustomer(me.id, req.body, req.user!.id))
  }),
)

// --- staff ---

customersRouter.get(
  '/',
  requireRole(...DESK, 'KEEPER', 'VET'),
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await customers.listCustomers(req.query as { q?: string; hasLogin?: 'yes' | 'no' }))
  }),
)

customersRouter.get(
  '/:id',
  requireRole(...DESK),
  asyncHandler(async (req, res) => {
    res.json(await customers.getCustomer(Number(req.params.id)))
  }),
)

customersRouter.post(
  '/',
  requireRole(...DESK),
  validate(customerSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await customers.createCustomer(req.body, req.user!.id))
  }),
)

customersRouter.put(
  '/:id',
  requireRole(...DESK),
  validate(customerSchema),
  asyncHandler(async (req, res) => {
    res.json(await customers.updateCustomer(Number(req.params.id), req.body, req.user!.id))
  }),
)
