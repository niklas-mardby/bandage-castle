import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import * as billing from './billing-v2.service'

export const billingV2Router = Router()

billingV2Router.use(requireRole('ADMIN', 'FRONT_DESK'))

billingV2Router.get(
  '/invoices',
  asyncHandler(async (req, res) => {
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    res.json(await billing.listInvoices({ customerId, status }))
  }),
)

billingV2Router.get(
  '/invoices/legacy/:legacyId',
  asyncHandler(async (req, res) => {
    res.json(await billing.getByLegacyId(Number(req.params.legacyId)))
  }),
)

billingV2Router.get(
  '/invoices/:id',
  asyncHandler(async (req, res) => {
    res.json(await billing.getInvoice(Number(req.params.id)))
  }),
)

billingV2Router.post(
  '/invoices/from-stay/:stayId',
  asyncHandler(async (req, res) => {
    res.status(201).json(await billing.createFromStay(Number(req.params.stayId)))
  }),
)

billingV2Router.post(
  '/invoices/:id/void',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    res.json(await billing.voidInvoice(Number(req.params.id)))
  }),
)
