import { Router, type Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import * as reports from './reports.service'

export const reportsRouter = Router()

reportsRouter.use(requireRole('ADMIN', 'FRONT_DESK'))

const rangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function send(res: Response, data: unknown, csv: boolean, filename: string) {
  if (!csv) return res.json(data)
  const rows = Array.isArray(data) ? data : [data]
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`)
  res.send(reports.toCsv(rows as Record<string, unknown>[]))
}

reportsRouter.get(
  '/occupancy',
  asyncHandler(async (req, res) => {
    const q = rangeSchema.parse(req.query)
    const to = q.to ? new Date(q.to) : new Date()
    const from = q.from ? new Date(q.from) : new Date(to.getTime() - 89 * 24 * 60 * 60 * 1000)
    const data = await reports.occupancy(from, to)
    if (req.query.format === 'csv') return send(res, data.days.map((d) => ({ day: d.day, total: d.total, capacity: data.capacity })), true, 'occupancy')
    res.json(data)
  }),
)

reportsRouter.get(
  '/revenue-by-reason',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.year) || new Date().getFullYear()
    send(res, await reports.revenueByReason(year), req.query.format === 'csv', `revenue-${year}`)
  }),
)

reportsRouter.get(
  '/stays-per-month',
  asyncHandler(async (req, res) => {
    const months = Math.min(48, Number(req.query.months) || 24)
    const data = await reports.staysPerMonth(months)
    send(res, req.query.format === 'csv' ? data.map((d) => ({ month: d.month, total: d.total, ...d.byReason })) : data, req.query.format === 'csv', 'stays-per-month')
  }),
)

reportsRouter.get(
  '/top-customers',
  asyncHandler(async (req, res) => {
    send(res, await reports.topCustomers(Math.min(50, Number(req.query.limit) || 10)), req.query.format === 'csv', 'top-customers')
  }),
)

reportsRouter.get(
  '/average-stay',
  asyncHandler(async (req, res) => {
    send(res, await reports.averageStay(), req.query.format === 'csv', 'average-stay')
  }),
)

reportsRouter.get(
  '/hiring',
  asyncHandler(async (_req, res) => {
    res.json(await reports.hiring())
  }),
)
